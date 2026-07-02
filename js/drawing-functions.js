// Drawing functions for Flappy 8-Bit game
// Renders the parallax scenery, pipes and ground with day/night support.
//
// All scenery is deterministic: layouts are generated once per resize/theme
// change from a seeded PRNG and animated with time-based offsets, so nothing
// flickers frame to frame and nothing allocates inside the render loop.

// ---------------------------------------------------------------------------
// Scenery state
// ---------------------------------------------------------------------------

let scenery = null;            // cached layout + gradients, rebuilt on resize/theme change
let parallaxFar = 0;           // scroll offsets in px (world moves left)
let parallaxMid = 0;
let parallaxGround = 0;
let cloudDrift = 0;
let sceneryLastTime = 0;

// Deterministic PRNG so the world doesn't reshuffle every frame
function mulberry32(seed) {
    let a = seed >>> 0;
    return function () {
        a |= 0; a = (a + 0x6D2B79F5) | 0;
        let t = Math.imul(a ^ (a >>> 15), 1 | a);
        t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
        return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
}

// Cheap integer hash for tiled ground details (stable per world column)
function hash2(i, salt) {
    let h = (i * 374761393 + salt * 668265263) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Canvas size in CSS pixels (the game's logical coordinate space)
function viewW() {
    const dpr = (typeof currentDpr !== 'undefined' && currentDpr) ? currentDpr : 1;
    return canvas.width / dpr;
}
function viewH() {
    const dpr = (typeof currentDpr !== 'undefined' && currentDpr) ? currentDpr : 1;
    return canvas.height / dpr;
}
function groundTop() {
    return (typeof ground !== 'undefined' && ground && ground.y)
        ? ground.y
        : viewH() - GROUND_HEIGHT;
}

// ---------------------------------------------------------------------------
// Palettes
// ---------------------------------------------------------------------------

const SCENERY_THEMES = {
    day: {
        skyStops: [[0, '#3E8EDE'], [0.55, '#71C6E8'], [1, '#C8EFF5']],
        farLayer: '#93D4DE',
        midLayer: '#7CC96F',
        midLayerShade: '#65B25A',
        cloud: 'rgba(255,255,255,0.95)',
        cloudShade: 'rgba(214,240,246,0.95)',
        grass: '#7ECB3F', grassLight: '#A8E063', grassSeam: '#5FA030',
        dirt: '#E3D18F', dirtSpeck: '#D2BE74', dirtSpeckDark: '#C0AA5E',
        pipe: { edge: '#4E8F1F', shade: '#63AD27', mid: '#74BF2E', hi: '#9FE04A', outline: '#2F5D10', rim: '#B8F06A' }
    },
    night: {
        skyStops: [[0, '#070B22'], [0.55, '#1B2340'], [1, '#40466F']],
        farLayer: '#151B38',
        midLayer: '#12321F',
        midLayerShade: '#0C2617',
        cloud: 'rgba(150,160,200,0.22)',
        cloudShade: 'rgba(120,130,175,0.22)',
        grass: '#2E5D3A', grassLight: '#3E7A4C', grassSeam: '#1F4429',
        dirt: '#4A3B22', dirtSpeck: '#57462A', dirtSpeckDark: '#3C2F1A',
        pipe: { edge: '#173A22', shade: '#20512F', mid: '#2A623D', hi: '#3E7A4C', outline: '#0E2415', rim: '#5CB878', glow: 'rgba(102,242,184,0.16)', glowLine: '#66F2B8' }
    }
};

// ---------------------------------------------------------------------------
// Scenery construction (once per resize / theme change)
// ---------------------------------------------------------------------------

function ensureScenery() {
    const w = viewW();
    const h = viewH();
    const mode = isDarkMode ? 'night' : 'day';
    if (scenery && scenery.w === w && scenery.h === h && scenery.mode === mode) {
        return scenery;
    }

    const theme = SCENERY_THEMES[mode];
    const rand = mulberry32(1337);
    const horizon = groundTop();

    // Sky gradient
    const sky = ctx.createLinearGradient(0, 0, 0, horizon + GROUND_HEIGHT * 0.4);
    for (const [stop, color] of theme.skyStops) sky.addColorStop(stop, color);

    // Stars (night only, but cheap to build always)
    const stars = [];
    for (let i = 0; i < 70; i++) {
        stars.push({
            x: rand() * w,
            y: rand() * horizon * 0.85,
            size: rand() < 0.85 ? 2 : 3,
            phase: rand() * Math.PI * 2,
            speed: 0.6 + rand() * 1.8,
            bright: rand() < 0.12 // a few standout stars get a sparkle cross
        });
    }

    // Clouds: pixel-art puffs described as stacked rows [dx, dy, w, h]
    const clouds = [];
    const cloudCount = Math.max(4, Math.round(w / 110));
    for (let i = 0; i < cloudCount; i++) {
        const scale = 0.7 + rand() * 1.1;
        clouds.push({
            x: rand() * (w + 200) - 100,
            y: 30 + rand() * horizon * 0.42,
            scale,
            speed: 3 + rand() * 5,
            alpha: 0.65 + rand() * 0.35
        });
    }

    // Far hill silhouette: column heights from layered sines (8px steps)
    const step = 8;
    const cols = Math.ceil(w / step) + 2;
    const farHeights = [];
    const p1 = rand() * Math.PI * 2, p2 = rand() * Math.PI * 2;
    for (let i = 0; i < cols * 3; i++) { // 3 screens wide, tiles by wrapping
        const t = i * step * 0.011;
        farHeights.push(
            34 + 26 * (0.5 + 0.5 * Math.sin(t + p1)) + 14 * (0.5 + 0.5 * Math.sin(t * 2.7 + p2))
        );
    }

    // Mid layer. Day: rolling bushes. Night: city skyline with lit windows.
    const buildings = [];
    if (mode === 'night') {
        let x = 0;
        const skylineWidth = w * 3;
        while (x < skylineWidth) {
            const bw = 26 + Math.floor(rand() * 40);
            const bh = 40 + rand() * 90;
            const windows = [];
            for (let wx = 5; wx < bw - 6; wx += 9) {
                for (let wy = 8; wy < bh - 6; wy += 12) {
                    if (rand() < 0.35) {
                        windows.push({ x: wx, y: wy, warm: rand() < 0.7 });
                    }
                }
            }
            buildings.push({ x, w: bw, h: bh, windows });
            x += bw + 2 + Math.floor(rand() * 8);
        }
    }
    const midHeights = [];
    const p3 = rand() * Math.PI * 2, p4 = rand() * Math.PI * 2;
    for (let i = 0; i < cols * 3; i++) {
        const t = i * step * 0.02;
        midHeights.push(
            16 + 18 * (0.5 + 0.5 * Math.sin(t + p3)) + 10 * (0.5 + 0.5 * Math.sin(t * 3.3 + p4))
        );
    }

    // Moon halo gradient (night)
    const moonX = w * 0.78, moonY = horizon * 0.18, moonR = 26;
    let moonHalo = null;
    if (mode === 'night') {
        moonHalo = ctx.createRadialGradient(moonX, moonY, moonR * 0.4, moonX, moonY, moonR * 3.4);
        moonHalo.addColorStop(0, 'rgba(244,241,222,0.35)');
        moonHalo.addColorStop(1, 'rgba(244,241,222,0)');
    }
    // Sun halo gradient (day)
    const sunX = w * 0.8, sunY = horizon * 0.16, sunR = 30;
    let sunHalo = null;
    if (mode === 'day') {
        sunHalo = ctx.createRadialGradient(sunX, sunY, sunR * 0.4, sunX, sunY, sunR * 3.2);
        sunHalo.addColorStop(0, 'rgba(255,236,160,0.55)');
        sunHalo.addColorStop(1, 'rgba(255,236,160,0)');
    }

    scenery = {
        w, h, mode, theme, sky, stars, clouds,
        step, farHeights, midHeights, buildings,
        sun: { x: sunX, y: sunY, r: sunR, halo: sunHalo },
        moon: { x: moonX, y: moonY, r: moonR, halo: moonHalo }
    };
    return scenery;
}

// Force a scenery rebuild (theme switches mid-session)
function invalidateScenery() {
    scenery = null;
}

// ---------------------------------------------------------------------------
// Background
// ---------------------------------------------------------------------------

function drawBackground() {
    const s = ensureScenery();
    const w = s.w;
    const horizon = groundTop();
    const now = performance.now();

    // Advance parallax with real time; freeze the world on the game-over screen
    let dt = sceneryLastTime ? (now - sceneryLastTime) / 1000 : 0;
    if (dt > 0.1) dt = 0.1;
    sceneryLastTime = now;
    const playing = (typeof gameStarted !== 'undefined' && gameStarted) &&
                    !(typeof gameOver !== 'undefined' && gameOver);
    if (typeof gameOver !== 'undefined' && gameOver) dt = 0;

    const pipeSpeed = (typeof PIPE_SPEED_PPS !== 'undefined') ? PIPE_SPEED_PPS : 186;
    parallaxFar += dt * (4 + (playing ? pipeSpeed * 0.10 : 0));
    parallaxMid += dt * (9 + (playing ? pipeSpeed * 0.25 : 0));
    parallaxGround += dt * (playing ? pipeSpeed : 12);
    cloudDrift += dt;

    // Sky
    ctx.fillStyle = s.sky;
    ctx.fillRect(0, 0, w, horizon + GROUND_HEIGHT);

    if (s.mode === 'night') {
        drawStars(s, now);
        // Moon
        ctx.fillStyle = s.moon.halo;
        ctx.fillRect(s.moon.x - s.moon.r * 3.4, s.moon.y - s.moon.r * 3.4, s.moon.r * 6.8, s.moon.r * 6.8);
        drawPixelDisc(s.moon.x, s.moon.y, s.moon.r, '#F4F1DE');
        // Craters + earthshade for an 8-bit moon
        ctx.fillStyle = '#DDD8BC';
        ctx.fillRect(s.moon.x - 10, s.moon.y - 4, 8, 8);
        ctx.fillRect(s.moon.x + 4, s.moon.y + 6, 6, 6);
        ctx.fillRect(s.moon.x + 2, s.moon.y - 14, 5, 5);
    } else {
        // Sun
        ctx.fillStyle = s.sun.halo;
        ctx.fillRect(s.sun.x - s.sun.r * 3.2, s.sun.y - s.sun.r * 3.2, s.sun.r * 6.4, s.sun.r * 6.4);
        drawPixelDisc(s.sun.x, s.sun.y, s.sun.r, '#FFE066');
        drawPixelDisc(s.sun.x, s.sun.y, s.sun.r - 8, '#FFF0A8');
    }

    drawFarLayer(s, horizon);
    drawMidLayer(s, horizon);
    drawClouds(s);
}

// Filled "pixel circle" out of horizontal strips (crisper than arc for 8-bit)
function drawPixelDisc(cx, cy, r, color) {
    ctx.fillStyle = color;
    const stepY = 4;
    for (let y = -r; y < r; y += stepY) {
        const half = Math.floor(Math.sqrt(Math.max(0, r * r - y * y)) / 4) * 4;
        ctx.fillRect(Math.round(cx - half), Math.round(cy + y), half * 2, stepY);
    }
}

// Distant hills (day) / distant ridge (night), slow parallax
function drawFarLayer(s, horizon) {
    const { step, farHeights, theme, w } = s;
    const total = farHeights.length;
    const offsetCols = Math.floor(parallaxFar / step);
    const subOffset = parallaxFar % step;

    ctx.fillStyle = theme.farLayer;
    for (let i = -1; i <= Math.ceil(w / step); i++) {
        const hCol = farHeights[((i + offsetCols) % total + total) % total];
        ctx.fillRect(i * step - subOffset, horizon - hCol, step + 1, hCol);
    }
}

// Near band: bushes (day) or city skyline with lit windows (night)
function drawMidLayer(s, horizon) {
    const { step, midHeights, theme, w, mode, buildings } = s;

    if (mode === 'night' && buildings.length) {
        const span = buildings[buildings.length - 1].x + buildings[buildings.length - 1].w + 10;
        const scroll = parallaxMid % span;
        ctx.fillStyle = theme.farLayer;
        for (const b of buildings) {
            let bx = b.x - scroll;
            if (bx + b.w < 0) bx += span;
            if (bx > w) bx -= span;
            if (bx + b.w < 0 || bx > w) continue;
            ctx.fillStyle = '#10152C';
            ctx.fillRect(Math.round(bx), horizon - b.h, b.w, b.h);
            // windows: tiny warm/cool lights, a few blink very slowly
            for (const win of b.windows) {
                const tick = Math.floor(performance.now() / 1700) + win.x + win.y;
                if ((tick & 7) === 0) continue; // occasional dark window
                ctx.fillStyle = win.warm ? '#FFD87A' : '#9AD9FF';
                ctx.fillRect(Math.round(bx + win.x), horizon - b.h + win.y, 4, 5);
            }
        }
        return;
    }

    const total = midHeights.length;
    const offsetCols = Math.floor(parallaxMid / step);
    const subOffset = parallaxMid % step;
    for (let i = -1; i <= Math.ceil(w / step); i++) {
        const hCol = midHeights[((i + offsetCols) % total + total) % total];
        ctx.fillStyle = theme.midLayer;
        ctx.fillRect(i * step - subOffset, horizon - hCol, step + 1, hCol);
        ctx.fillStyle = theme.midLayerShade;
        ctx.fillRect(i * step - subOffset, horizon - hCol * 0.45, step + 1, hCol * 0.45);
    }
}

// Twinkling stars (deterministic positions, sine twinkle)
function drawStars(s, now) {
    const t = now / 1000;
    for (const star of s.stars) {
        const tw = 0.35 + 0.65 * (0.5 + 0.5 * Math.sin(t * star.speed + star.phase));
        ctx.globalAlpha = tw;
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(star.x, star.y, star.size, star.size);
        if (star.bright && tw > 0.8) {
            ctx.globalAlpha = (tw - 0.8) * 3;
            ctx.fillRect(star.x - star.size, star.y, star.size * 3, 1);
            ctx.fillRect(star.x, star.y - star.size, 1, star.size * 3);
        }
    }
    ctx.globalAlpha = 1;
}

// Drifting two-tone pixel clouds
function drawClouds(s) {
    const w = s.w;
    for (const c of s.clouds) {
        let x = c.x - (cloudDrift * c.speed) % (w + 240);
        if (x < -140) x += w + 240;
        const u = c.scale; // one cloud "pixel" unit
        ctx.globalAlpha = c.alpha;
        ctx.fillStyle = s.theme.cloud;
        ctx.fillRect(x + 10 * u, c.y, 44 * u, 12 * u);
        ctx.fillRect(x, c.y + 10 * u, 64 * u, 12 * u);
        ctx.fillRect(x + 20 * u, c.y - 8 * u, 22 * u, 10 * u);
        ctx.fillStyle = s.theme.cloudShade;
        ctx.fillRect(x, c.y + 17 * u, 64 * u, 5 * u);
    }
    ctx.globalAlpha = 1;
}

// ---------------------------------------------------------------------------
// Ground
// ---------------------------------------------------------------------------

function drawGround() {
    const s = ensureScenery();
    const theme = s.theme;
    const w = s.w;
    const groundY = groundTop();
    const scroll = Math.floor(parallaxGround);

    // Dirt body
    ctx.fillStyle = theme.dirt;
    ctx.fillRect(0, groundY, w, GROUND_HEIGHT);

    // Deterministic dirt speckles, tiled by world column so they scroll
    for (let x = -(scroll % 16); x < w; x += 16) {
        const col = Math.floor((x + scroll) / 16);
        for (let row = 0; row < Math.floor((GROUND_HEIGHT - 34) / 16); row++) {
            const r = hash2(col, row * 7 + 1);
            if (r < 0.30) {
                ctx.fillStyle = r < 0.15 ? theme.dirtSpeck : theme.dirtSpeckDark;
                const size = r < 0.08 ? 8 : 6;
                ctx.fillRect(x + Math.floor(hash2(col, row + 40) * 8), groundY + 36 + row * 16, size, size);
            }
        }
    }

    // Grass strip: highlight, body, seam
    ctx.fillStyle = theme.grassLight;
    ctx.fillRect(0, groundY, w, 6);
    ctx.fillStyle = theme.grass;
    ctx.fillRect(0, groundY + 6, w, 14);
    ctx.fillStyle = theme.grassSeam;
    ctx.fillRect(0, groundY + 20, w, 4);

    // Deterministic grass tufts above the strip (scroll with the ground)
    for (let x = -(scroll % 12); x < w; x += 12) {
        const col = Math.floor((x + scroll) / 12);
        const r = hash2(col, 99);
        if (r < 0.7) {
            const tuftH = 2 + Math.floor(r * 6);
            ctx.fillStyle = r < 0.35 ? theme.grassLight : theme.grass;
            ctx.fillRect(x, groundY - tuftH, 4, tuftH);
        }
    }
}

// ---------------------------------------------------------------------------
// Pipes
// ---------------------------------------------------------------------------

function drawPipes() {
    for (const pipe of pipes) {
        drawPipe(pipe);
    }
}

// A pixel-shaded pipe column: dark edges -> mid tones -> highlight stripe
function drawPipeColumn(p, x, width, y, height) {
    if (height <= 0) return;
    const bands = [
        [0.00, 0.08, p.outline],
        [0.08, 0.16, p.edge],
        [0.16, 0.30, p.shade],
        [0.30, 0.52, p.mid],
        [0.52, 0.68, p.hi],
        [0.68, 0.82, p.mid],
        [0.82, 0.92, p.shade],
        [0.92, 1.00, p.outline]
    ];
    for (const [from, to, color] of bands) {
        ctx.fillStyle = color;
        const bx = Math.round(x + width * from);
        const bw = Math.max(1, Math.round(width * (to - from)));
        ctx.fillRect(bx, y, bw, height);
    }
}

function drawPipe(pipe) {
    const s = ensureScenery();
    const p = s.theme.pipe;
    const capHeight = 30;
    const capLip = 8;
    const width = pipe.width;
    const groundY = groundTop();

    const topBodyH = pipe.top.height - capHeight;
    const bottomBodyY = pipe.bottom.y + capHeight;
    const bottomBodyH = Math.max(0, groundY - bottomBodyY);

    // Night pipes get a soft emissive aura so they read against the dark sky
    if (p.glow) {
        ctx.fillStyle = p.glow;
        ctx.fillRect(pipe.x - capLip - 5, 0, width + capLip * 2 + 10, pipe.top.height + 5);
        ctx.fillRect(pipe.x - capLip - 5, pipe.bottom.y - 5, width + capLip * 2 + 10, groundY - pipe.bottom.y + 5);
    }

    // Bodies
    drawPipeColumn(p, pipe.x, width, 0, topBodyH);
    drawPipeColumn(p, pipe.x, width, bottomBodyY, bottomBodyH);

    // Caps (slightly wider, same shading, plus rim lines facing the gap)
    drawPipeColumn(p, pipe.x - capLip, width + capLip * 2, topBodyH, capHeight);
    drawPipeColumn(p, pipe.x - capLip, width + capLip * 2, pipe.bottom.y, capHeight);

    ctx.fillStyle = p.outline;
    ctx.fillRect(pipe.x - capLip, topBodyH, width + capLip * 2, 3);                       // top cap upper edge
    ctx.fillRect(pipe.x - capLip, pipe.bottom.y + capHeight - 3, width + capLip * 2, 3);  // bottom cap lower edge

    // Gap-facing rims: bright line to make the safe opening pop
    ctx.fillStyle = p.glowLine || p.rim;
    ctx.fillRect(pipe.x - capLip, pipe.top.height - 3, width + capLip * 2, 3);
    ctx.fillRect(pipe.x - capLip, pipe.bottom.y, width + capLip * 2, 3);
}

// ---------------------------------------------------------------------------
// Theme switching hook: rebuild cached gradients when dark mode toggles
// ---------------------------------------------------------------------------

document.addEventListener('DOMContentLoaded', function () {
    const toggle = document.getElementById('dark-mode-toggle');
    if (toggle) {
        toggle.addEventListener('click', invalidateScenery);
    }
});
