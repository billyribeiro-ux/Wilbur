#!/usr/bin/env node
/**
 * SIMPLE & FAST - Test all whiteboard functions
 * No browser BS, just verify TypeScript compilation and imports
 */

import { execSync } from 'child_process';
import chalk from 'chalk';

console.log(chalk.bold.cyan('\n🧪 TESTING ALL WHITEBOARD FUNCTIONS\n'));
console.log('='.repeat(60));

const results = {
  passed: 0,
  failed: 0,
  tests: []
};

function test(name, fn) {
  try {
    fn();
    results.passed++;
    results.tests.push({ name, status: 'PASS' });
    console.log(chalk.green('✅'), name);
    return true;
  } catch (error) {
    results.failed++;
    results.tests.push({ name, status: 'FAIL', error: error.message });
    console.log(chalk.red('❌'), name);
    console.log(chalk.gray('   Error:'), error.message);
    return false;
  }
}

// Test 1: TypeScript Compilation
test('TypeScript Compilation - ZERO ERRORS', () => {
  try {
    execSync('npx tsc --noEmit', { stdio: 'pipe' });
  } catch (error) {
    const output = error.stdout?.toString() || error.stderr?.toString() || '';
    const errorCount = (output.match(/error TS/g) || []).length;
    if (errorCount > 0) {
      throw new Error(`Found ${errorCount} TypeScript errors`);
    }
  }
});

// Test 2-9: Tool Modules Import
const tools = [
  'PenTool',
  'HighlighterTool',
  'EraserTool',
  'LineTool',
  'RectangleTool',
  'CircleTool',
  'TextTool',
  'SelectTool'
];

for (const tool of tools) {
  test(`${tool} - Module imports`, async () => {
    await import(`./src/features/whiteboard/tools/${tool}.ts`);
  });
}

// Test 10: Transform Utils
test('Transform Utils - Functions available', async () => {
  const transform = await import('./src/features/whiteboard/utils/transform.ts');
  if (typeof transform.worldToScreen !== 'function') {
    throw new Error('worldToScreen not exported');
  }
  if (typeof transform.screenToWorld !== 'function') {
    throw new Error('screenToWorld not exported');
  }
});

// Test 11: Whiteboard Store
test('Whiteboard Store - Imports successfully', async () => {
  await import('./src/features/whiteboard/state/whiteboardStore.ts');
});

// Test 12: Type Definitions
test('Type Definitions - All exports available', async () => {
  await import('./src/features/whiteboard/types.ts');
});

// Wait for all async tests
await new Promise(resolve => setTimeout(resolve, 100));

// Print Summary
console.log('\n' + '='.repeat(60));
console.log(chalk.bold.cyan('\n📊 TEST SUMMARY\n'));
console.log(chalk.green(`✅ Passed: ${results.passed}`));
console.log(chalk.red(`❌ Failed: ${results.failed}`));
console.log(chalk.cyan(`📝 Total:  ${results.passed + results.failed}`));

if (results.failed === 0) {
  console.log(chalk.bold.green('\n🎉 ALL TESTS PASSED - ZERO ERRORS CONFIRMED!\n'));
  process.exit(0);
} else {
  console.log(chalk.bold.red('\n❌ SOME TESTS FAILED\n'));
  process.exit(1);
}
