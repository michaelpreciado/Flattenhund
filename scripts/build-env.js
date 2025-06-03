#!/usr/bin/env node

/**
 * Build script for Netlify deployment
 * This creates a JavaScript file with environment variables that can be loaded by the browser
 */

const fs = require('fs');
const path = require('path');

// Environment variables to extract (Netlify will have these set)
const envVars = {
  VITE_SUPABASE_URL: process.env.VITE_SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL,
  VITE_SUPABASE_ANON_KEY: process.env.VITE_SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY
};

// Filter out undefined values
const validEnvVars = Object.fromEntries(
  Object.entries(envVars).filter(([key, value]) => value !== undefined)
);

// Create the environment variables JavaScript file
const envFileContent = `
// Environment variables injected by Netlify build process
// This file is auto-generated - do not edit manually

window.NETLIFY_ENV = ${JSON.stringify(validEnvVars, null, 2)};

// Also set individual globals for compatibility
${Object.entries(validEnvVars).map(([key, value]) => 
  `window.${key} = ${JSON.stringify(value)};`
).join('\n')}

console.log('🚀 Netlify environment variables loaded:', Object.keys(window.NETLIFY_ENV || {}));
`;

// Write the file
const outputPath = path.join(__dirname, '..', 'js', 'netlify-env.js');
fs.writeFileSync(outputPath, envFileContent);

console.log('✅ Environment variables file created:', outputPath);
console.log('📦 Variables included:', Object.keys(validEnvVars));

// If no environment variables were found, create an empty file
if (Object.keys(validEnvVars).length === 0) {
  console.log('⚠️  No Supabase environment variables found.');
  console.log('💡 Make sure to set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in Netlify.');
} 