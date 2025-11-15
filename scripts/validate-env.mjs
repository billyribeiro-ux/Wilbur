#!/usr/bin/env node
/**
 * Environment Validation Script - Microsoft L68+ Standard
 * Validates that all required environment variables are properly configured
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

console.log('\n🔍 ENVIRONMENT VALIDATION - Microsoft Enterprise Standard\n');
console.log('='.repeat(70));

// Check if .env file exists
const envPath = join(rootDir, '.env');
const envExists = existsSync(envPath);

console.log('\n📋 ENVIRONMENT FILE:');
console.log(`   Location: ${envPath}`);
console.log(`   Status: ${envExists ? '✅ EXISTS' : '❌ NOT FOUND'}`);

if (!envExists) {
  console.log('\n❌ CRITICAL ERROR: No .env file found!\n');
  console.log('📝 ACTION REQUIRED:');
  console.log('   1. Copy .env.template to .env:');
  console.log('      cp .env.template .env\n');
  console.log('   2. Get your Supabase credentials from:');
  console.log('      https://app.supabase.com/project/_/settings/api\n');
  console.log('   3. Edit .env and add:');
  console.log('      VITE_SUPABASE_URL=https://your-project.supabase.co');
  console.log('      VITE_SUPABASE_ANON_KEY=your-anon-key-here\n');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}

// Parse .env file
const envContent = readFileSync(envPath, 'utf-8');
const envVars = {};

envContent.split('\n').forEach(line => {
  line = line.trim();
  if (line && !line.startsWith('#')) {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  }
});

console.log('\n🔐 REQUIRED VARIABLES:');

// Check Supabase URL
const supabaseUrl = envVars.VITE_SUPABASE_URL;
if (!supabaseUrl || supabaseUrl.includes('your-project-ref')) {
  console.log('   ❌ VITE_SUPABASE_URL: NOT CONFIGURED');
  console.log('      Current value:', supabaseUrl || '(empty)');
  console.log('      Expected format: https://xxxxx.supabase.co');
} else {
  try {
    const url = new URL(supabaseUrl);
    if (url.hostname.endsWith('.supabase.co')) {
      console.log('   ✅ VITE_SUPABASE_URL: CONFIGURED');
      console.log('      Value:', supabaseUrl);
    } else {
      console.log('   ⚠️  VITE_SUPABASE_URL: INVALID FORMAT');
      console.log('      Current:', supabaseUrl);
      console.log('      Expected: *.supabase.co domain');
    }
  } catch (error) {
    console.log('   ❌ VITE_SUPABASE_URL: INVALID URL');
    console.log('      Value:', supabaseUrl);
  }
}

// Check Supabase Anon Key
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;
if (!supabaseKey || supabaseKey.includes('your-anon-key')) {
  console.log('   ❌ VITE_SUPABASE_ANON_KEY: NOT CONFIGURED');
  console.log('      Current value:', supabaseKey ? '(placeholder)' : '(empty)');
} else if (supabaseKey.length < 100) {
  console.log('   ⚠️  VITE_SUPABASE_ANON_KEY: TOO SHORT');
  console.log('      Length:', supabaseKey.length, 'characters');
  console.log('      Expected: ~200+ characters');
} else {
  console.log('   ✅ VITE_SUPABASE_ANON_KEY: CONFIGURED');
  console.log('      Length:', supabaseKey.length, 'characters');
}

// Optional variables
console.log('\n📦 OPTIONAL VARIABLES:');

const optionalVars = [
  'VITE_LIVEKIT_URL',
  'VITE_DAILY_DOMAIN',
  'NEXT_PUBLIC_CLARITY_ID'
];

optionalVars.forEach(varName => {
  const value = envVars[varName];
  if (value && !value.includes('your-') && !value.includes('optional')) {
    console.log(`   ✅ ${varName}: CONFIGURED`);
  } else {
    console.log(`   ⚪ ${varName}: NOT CONFIGURED (optional)`);
  }
});

// Final validation
console.log('\n' + '='.repeat(70));

const hasUrl = supabaseUrl && !supabaseUrl.includes('your-project-ref');
const hasKey = supabaseKey && !supabaseKey.includes('your-anon-key') && supabaseKey.length > 100;

if (hasUrl && hasKey) {
  console.log('✅ ENVIRONMENT VALIDATION PASSED\n');
  console.log('Your application is properly configured and ready to run.\n');
  process.exit(0);
} else {
  console.log('❌ ENVIRONMENT VALIDATION FAILED\n');
  console.log('⚠️  Missing required Supabase credentials!\n');
  console.log('📝 SETUP INSTRUCTIONS:\n');
  console.log('1. Go to https://app.supabase.com/');
  console.log('2. Select your project (or create one)');
  console.log('3. Go to Settings > API');
  console.log('4. Copy the following values to your .env file:');
  console.log('   - Project URL → VITE_SUPABASE_URL');
  console.log('   - anon public key → VITE_SUPABASE_ANON_KEY\n');
  console.log('5. Restart your dev server after updating .env\n');
  console.log('='.repeat(70) + '\n');
  process.exit(1);
}
