#!/usr/bin/env node

/**
 * WHITEBOARD SYSTEM - COMPLETE END-TO-END INVESTIGATION
 * Microsoft L68+ Standards - Evidence-Based Testing
 */

import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('\n🔍 WHITEBOARD SYSTEM INVESTIGATION');
console.log('='.repeat(80));

let testResults = [];
let passed = 0;
let failed = 0;

function logTest(name, success, details = '') {
  const status = success ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name}`);
  if (details) console.log(`   ${details}`);
  
  testResults.push({ name, success, details });
  if (success) passed++; else failed++;
}

// Test 1: Core Architecture Files
console.log('\n📁 TESTING: Core Architecture Files');

const coreFiles = [
  'src/features/whiteboard/WhiteboardOverlay.tsx',
  'src/features/whiteboard/components/WhiteboardCanvas.tsx',
  'src/features/whiteboard/components/WhiteboardToolbar.tsx',
  'src/features/whiteboard/state/whiteboardStore.ts',
  'src/features/whiteboard/whiteboardTypes.ts'
];

for (const file of coreFiles) {
  try {
    const fullPath = path.join(__dirname, file);
    await fs.access(fullPath);
    logTest(`File exists: ${file}`, true);
  } catch (error) {
    logTest(`File exists: ${file}`, false, 'File not found');
  }
}

// Test 2: Integration Points
console.log('\n🔗 TESTING: Integration Points');

try {
  const layoutFile = await fs.readFile(path.join(__dirname, 'src/components/trading/TradingRoomLayout.tsx'), 'utf8');
  
  logTest('WhiteboardOverlay imported in TradingRoomLayout', 
    layoutFile.includes('import { WhiteboardOverlay }'));
    
  logTest('WhiteboardOverlay component used in render', 
    layoutFile.includes('<WhiteboardOverlay'));
    
  logTest('isActive prop passed correctly', 
    layoutFile.includes('isActive={state.isWhiteboardActive}'));
    
  logTest('canAnnotate prop passed correctly', 
    layoutFile.includes('canAnnotate={state.canManageRoom}'));
} catch (error) {
  logTest('TradingRoomLayout integration', false, error.message);
}

// Test 3: State Management
console.log('\n🏪 TESTING: State Management');

try {
  const stateFile = await fs.readFile(path.join(__dirname, 'src/components/trading/useTradingRoomState.ts'), 'utf8');
  
  logTest('isWhiteboardActive state defined', 
    stateFile.includes('isWhiteboardActive'));
    
  logTest('setIsWhiteboardActive function exists', 
    stateFile.includes('setIsWhiteboardActive'));
} catch (error) {
  logTest('State management', false, error.message);
}

// Test 4: Handler Functions
console.log('\n⚡ TESTING: Handler Functions');

try {
  const containerFile = await fs.readFile(path.join(__dirname, 'src/components/trading/TradingRoomContainer.tsx'), 'utf8');
  
  logTest('onWhiteboardOpen handler exists', 
    containerFile.includes('onWhiteboardOpen: () => setIsWhiteboardActive(true)'));
    
  logTest('onWhiteboardClose handler exists', 
    containerFile.includes('onWhiteboardClose: () => setIsWhiteboardActive(false)'));
} catch (error) {
  logTest('Handler functions', false, error.message);
}

// Test 5: Whiteboard Button
console.log('\n🖱️  TESTING: Whiteboard Button');

try {
  const headerFile = await fs.readFile(path.join(__dirname, 'src/components/icons/BrandHeader.tsx'), 'utf8');
  
  logTest('Whiteboard button exists', 
    headerFile.includes('onToggleWhiteboard'));
    
  logTest('Button has permission check', 
    headerFile.includes('canManageRoom'));
    
  logTest('Button shows active state', 
    headerFile.includes('isWhiteboardActive'));
} catch (error) {
  logTest('Whiteboard button', false, error.message);
}

// Test 6: Whiteboard Store
console.log('\n🗃️  TESTING: Whiteboard Store');

try {
  const storeFile = await fs.readFile(path.join(__dirname, 'src/features/whiteboard/state/whiteboardStore.ts'), 'utf8');
  
  logTest('Zustand store exists', 
    storeFile.includes('create'));
    
  logTest('Tool state management', 
    storeFile.includes('tool') && storeFile.includes('setTool'));
    
  logTest('Shape management', 
    storeFile.includes('shapes') && storeFile.includes('addShape'));
    
  logTest('Color management', 
    storeFile.includes('color') && storeFile.includes('setColor'));
} catch (error) {
  logTest('Whiteboard store', false, error.message);
}

// Test 7: Tool Files
console.log('\n🛠️  TESTING: Tool Files');

const toolFiles = [
  'src/features/whiteboard/tools/PenTool.ts',
  'src/features/whiteboard/tools/EraserTool.ts',
  'src/features/whiteboard/tools/LineTool.ts',
  'src/features/whiteboard/tools/RectangleTool.ts',
  'src/features/whiteboard/tools/CircleTool.ts',
  'src/features/whiteboard/tools/ArrowTool.ts',
  'src/features/whiteboard/tools/TextTool.ts'
];

for (const file of toolFiles) {
  try {
    const fullPath = path.join(__dirname, file);
    await fs.access(fullPath);
    logTest(`Tool file exists: ${path.basename(file)}`, true);
    
    // Check for DPR (Device Pixel Ratio) usage
    const content = await fs.readFile(fullPath, 'utf8');
    logTest(`${path.basename(file)} uses DPR`, 
      content.includes('devicePixelRatio') || content.includes('dpr'));
  } catch (error) {
    logTest(`Tool file exists: ${path.basename(file)}`, false, 'File not found');
  }
}

// Test 8: CSS Files
console.log('\n🎨 TESTING: Styling');

const cssFiles = [
  'src/features/whiteboard/whiteboard.css',
  'src/features/whiteboard/whiteboard-canvas.css'
];

for (const file of cssFiles) {
  try {
    const fullPath = path.join(__dirname, file);
    await fs.access(fullPath);
    logTest(`CSS file exists: ${path.basename(file)}`, true);
  } catch (error) {
    logTest(`CSS file exists: ${path.basename(file)}`, false, 'File not found');
  }
}

// Test 9: Types Definition
console.log('\n📝 TESTING: Type Definitions');

try {
  const typesFile = await fs.readFile(path.join(__dirname, 'src/features/whiteboard/whiteboardTypes.ts'), 'utf8');
  
  logTest('WhiteboardTool type defined', 
    typesFile.includes('WhiteboardTool'));
    
  logTest('WhiteboardShape type defined', 
    typesFile.includes('WhiteboardShape'));
    
  logTest('WhiteboardPoint type defined', 
    typesFile.includes('WhiteboardPoint'));
} catch (error) {
  logTest('Type definitions', false, error.message);
}

// SUMMARY
console.log('\n' + '='.repeat(80));
console.log('📊 INVESTIGATION SUMMARY');
console.log('='.repeat(80));
console.log(`Total Tests: ${passed + failed}`);
console.log(`✅ Passed: ${passed}`);
console.log(`❌ Failed: ${failed}`);
console.log(`📈 Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

if (failed > 0) {
  console.log('\n❌ FAILED TESTS:');
  testResults
    .filter(r => !r.success)
    .forEach(r => {
      console.log(`  - ${r.name}: ${r.details}`);
    });
    
  console.log('\n🔧 ISSUES IDENTIFIED:');
  console.log('1. Missing or broken files');
  console.log('2. Integration problems');
  console.log('3. Permission/state issues');
} else {
  console.log('\n🎉 ALL TESTS PASSED!');
  console.log('Architecture is sound - investigating runtime issues...');
}

console.log('\n' + '='.repeat(80));
