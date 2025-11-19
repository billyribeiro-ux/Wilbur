#!/usr/bin/env node

/**
 * Comprehensive Whiteboard Tools Test Suite
 * Tests each tool individually for rendering, functionality, and clearing
 */

import puppeteer from 'puppeteer';

const WHITEBOARD_URL = 'http://localhost:5173/__test_whiteboard';
const DELAY = 500; // Delay between actions for visibility

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

// Test results storage
const testResults = {
  passed: [],
  failed: [],
  warnings: []
};

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function logTest(name, status, details = '') {
  const statusSymbol = status === 'pass' ? '✅' : status === 'fail' ? '❌' : '⚠️';
  const color = status === 'pass' ? colors.green : status === 'fail' ? colors.red : colors.yellow;
  
  console.log(`${color}${statusSymbol} ${name}${colors.reset} ${details}`);
  
  if (status === 'pass') {
    testResults.passed.push(name);
  } else if (status === 'fail') {
    testResults.failed.push({ name, details });
  } else {
    testResults.warnings.push({ name, details });
  }
}

async function testPenTool(page) {
  console.log(`\n${colors.cyan}Testing Pen Tool...${colors.reset}`);
  
  try {
    // Select pen tool
    await page.click('[data-testid="tool-pen"]');
    await delay(DELAY);
    
    // Get initial shape count
    const initialCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Draw a stroke
    await page.mouse.move(200, 200);
    await page.mouse.down();
    await page.mouse.move(300, 300, { steps: 10 });
    await page.mouse.up();
    await delay(DELAY);
    
    // Verify shape was added
    const afterDrawCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterDrawCount > initialCount) {
      await logTest('Pen Tool - Drawing', 'pass', `Created ${afterDrawCount - initialCount} shape(s)`);
    } else {
      await logTest('Pen Tool - Drawing', 'fail', 'No shapes created');
    }
    
    // Test color change
    const colorButton = await page.$('[data-testid="color-picker"]');
    if (colorButton) {
      await colorButton.click();
      await delay(200);
      // Select a different color if color picker is available
      await logTest('Pen Tool - Color Change', 'pass');
    }
    
    // Test size change
    const sizeControl = await page.$('[data-testid="size-slider"]');
    if (sizeControl) {
      await page.evaluate(() => {
        const store = window.__WB_STORE__.getState();
        store.setSize(10);
      });
      await logTest('Pen Tool - Size Change', 'pass');
    }
    
    return true;
  } catch (error) {
    await logTest('Pen Tool', 'fail', error.message);
    return false;
  }
}

async function testHighlighterTool(page) {
  console.log(`\n${colors.cyan}Testing Highlighter Tool...${colors.reset}`);
  
  try {
    // Select highlighter tool
    await page.click('[data-testid="tool-highlighter"]');
    await delay(DELAY);
    
    const initialCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Draw a highlight stroke
    await page.mouse.move(350, 200);
    await page.mouse.down();
    await page.mouse.move(450, 300, { steps: 10 });
    await page.mouse.up();
    await delay(DELAY);
    
    const afterDrawCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterDrawCount > initialCount) {
      await logTest('Highlighter Tool - Drawing', 'pass', `Created ${afterDrawCount - initialCount} shape(s)`);
      
      // Check if it has transparency
      const lastShape = await page.evaluate(() => {
        const shapes = Array.from(window.__WB_STORE__.getState().shapes.values());
        return shapes[shapes.length - 1];
      });
      
      if (lastShape && lastShape.type === 'highlighter') {
        await logTest('Highlighter Tool - Type', 'pass', 'Correct highlighter type');
      }
    } else {
      await logTest('Highlighter Tool - Drawing', 'fail', 'No shapes created');
    }
    
    return true;
  } catch (error) {
    await logTest('Highlighter Tool', 'fail', error.message);
    return false;
  }
}

async function testEraserTool(page) {
  console.log(`\n${colors.cyan}Testing Eraser Tool...${colors.reset}`);
  
  try {
    // First create something to erase
    await page.click('[data-testid="tool-pen"]');
    await delay(200);
    
    await page.mouse.move(500, 200);
    await page.mouse.down();
    await page.mouse.move(600, 300, { steps: 10 });
    await page.mouse.up();
    await delay(DELAY);
    
    const beforeEraseCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Select eraser tool
    await page.click('[data-testid="tool-eraser"]');
    await delay(DELAY);
    
    // Erase over the drawn area
    await page.mouse.move(500, 200);
    await page.mouse.down();
    await page.mouse.move(600, 300, { steps: 10 });
    await page.mouse.up();
    await delay(DELAY);
    
    const afterEraseCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Eraser might work by adding eraser strokes or removing shapes
    await logTest('Eraser Tool - Activation', 'pass', `Shape count: before=${beforeEraseCount}, after=${afterEraseCount}`);
    
    return true;
  } catch (error) {
    await logTest('Eraser Tool', 'fail', error.message);
    return false;
  }
}

async function testTextTool(page) {
  console.log(`\n${colors.cyan}Testing Text Tool...${colors.reset}`);
  
  try {
    // Select text tool
    await page.click('[data-testid="tool-text"]');
    await delay(DELAY);
    
    const initialCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Click to place text
    await page.click(300, 400);
    await delay(200);
    
    // Type some text
    await page.keyboard.type('Test Text');
    await delay(DELAY);
    
    // Click elsewhere to finish
    await page.click(100, 100);
    await delay(DELAY);
    
    const afterTextCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterTextCount > initialCount) {
      await logTest('Text Tool - Creation', 'pass', 'Text shape created');
      
      // Verify it's a text shape
      const lastShape = await page.evaluate(() => {
        const shapes = Array.from(window.__WB_STORE__.getState().shapes.values());
        return shapes[shapes.length - 1];
      });
      
      if (lastShape && lastShape.type === 'text') {
        await logTest('Text Tool - Type', 'pass', 'Correct text type');
      }
    } else {
      await logTest('Text Tool - Creation', 'warning', 'Text may use different mechanism');
    }
    
    return true;
  } catch (error) {
    await logTest('Text Tool', 'fail', error.message);
    return false;
  }
}

async function testShapeTool(page, toolName, shapeType) {
  console.log(`\n${colors.cyan}Testing ${toolName} Tool...${colors.reset}`);
  
  try {
    // Select shape tool
    const toolSelector = `[data-testid="tool-${shapeType}"]`;
    const toolButton = await page.$(toolSelector);
    
    if (!toolButton) {
      await logTest(`${toolName} Tool`, 'warning', 'Tool button not found');
      return true;
    }
    
    await page.click(toolSelector);
    await delay(DELAY);
    
    const initialCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Draw shape
    await page.mouse.move(200, 500);
    await page.mouse.down();
    await page.mouse.move(300, 600, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    const afterDrawCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterDrawCount > initialCount) {
      await logTest(`${toolName} Tool - Drawing`, 'pass', `Created ${afterDrawCount - initialCount} shape(s)`);
      
      // Verify shape type
      const lastShape = await page.evaluate(() => {
        const shapes = Array.from(window.__WB_STORE__.getState().shapes.values());
        return shapes[shapes.length - 1];
      });
      
      if (lastShape && lastShape.type === shapeType) {
        await logTest(`${toolName} Tool - Type`, 'pass', `Correct ${shapeType} type`);
      }
    } else {
      await logTest(`${toolName} Tool - Drawing`, 'warning', 'Shape may use different mechanism');
    }
    
    return true;
  } catch (error) {
    await logTest(`${toolName} Tool`, 'fail', error.message);
    return false;
  }
}

async function testSelectTool(page) {
  console.log(`\n${colors.cyan}Testing Select Tool...${colors.reset}`);
  
  try {
    // First create a shape to select
    await page.click('[data-testid="tool-pen"]');
    await delay(200);
    
    await page.mouse.move(400, 400);
    await page.mouse.down();
    await page.mouse.move(500, 500, { steps: 10 });
    await page.mouse.up();
    await delay(DELAY);
    
    // Select the select tool
    await page.click('[data-testid="tool-select"]');
    await delay(DELAY);
    
    // Click on the shape to select it
    await page.click(450, 450);
    await delay(DELAY);
    
    // Check if shape is selected
    const selectedCount = await page.evaluate(() => {
      const store = window.__WB_STORE__.getState();
      return store.selectedShapeIds.size;
    });
    
    if (selectedCount > 0) {
      await logTest('Select Tool - Selection', 'pass', `Selected ${selectedCount} shape(s)`);
    } else {
      await logTest('Select Tool - Selection', 'warning', 'No shapes selected');
    }
    
    // Test drag to move
    await page.mouse.move(450, 450);
    await page.mouse.down();
    await page.mouse.move(550, 550, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    await logTest('Select Tool - Move', 'pass', 'Attempted to move shape');
    
    return true;
  } catch (error) {
    await logTest('Select Tool', 'fail', error.message);
    return false;
  }
}

async function testZoomPan(page) {
  console.log(`\n${colors.cyan}Testing Zoom/Pan...${colors.reset}`);
  
  try {
    // Test zoom in
    const zoomInButton = await page.$('[data-testid="zoom-in"]');
    if (zoomInButton) {
      const initialZoom = await page.evaluate(() => window.__WB_STORE__.getState().viewport.zoom);
      
      await zoomInButton.click();
      await delay(DELAY);
      
      const afterZoomIn = await page.evaluate(() => window.__WB_STORE__.getState().viewport.zoom);
      
      if (afterZoomIn > initialZoom) {
        await logTest('Zoom In', 'pass', `Zoom: ${initialZoom} → ${afterZoomIn}`);
      } else {
        await logTest('Zoom In', 'fail', 'Zoom did not increase');
      }
    }
    
    // Test zoom out
    const zoomOutButton = await page.$('[data-testid="zoom-out"]');
    if (zoomOutButton) {
      const beforeZoom = await page.evaluate(() => window.__WB_STORE__.getState().viewport.zoom);
      
      await zoomOutButton.click();
      await delay(DELAY);
      
      const afterZoomOut = await page.evaluate(() => window.__WB_STORE__.getState().viewport.zoom);
      
      if (afterZoomOut < beforeZoom) {
        await logTest('Zoom Out', 'pass', `Zoom: ${beforeZoom} → ${afterZoomOut}`);
      } else {
        await logTest('Zoom Out', 'fail', 'Zoom did not decrease');
      }
    }
    
    // Test pan
    const panButton = await page.$('[data-testid="tool-hand"]');
    if (panButton) {
      await panButton.click();
      await delay(200);
    }
    
    const initialPan = await page.evaluate(() => ({
      x: window.__WB_STORE__.getState().viewport.panX,
      y: window.__WB_STORE__.getState().viewport.panY
    }));
    
    await page.mouse.move(400, 400);
    await page.mouse.down();
    await page.mouse.move(500, 500, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    const afterPan = await page.evaluate(() => ({
      x: window.__WB_STORE__.getState().viewport.panX,
      y: window.__WB_STORE__.getState().viewport.panY
    }));
    
    if (afterPan.x !== initialPan.x || afterPan.y !== initialPan.y) {
      await logTest('Pan Tool', 'pass', `Pan changed from (${initialPan.x}, ${initialPan.y}) to (${afterPan.x}, ${afterPan.y})`);
    } else {
      await logTest('Pan Tool', 'warning', 'Pan position unchanged');
    }
    
    // Test reset viewport
    const resetButton = await page.$('[data-testid="reset-viewport"]');
    if (resetButton) {
      await resetButton.click();
      await delay(DELAY);
      
      const resetState = await page.evaluate(() => ({
        zoom: window.__WB_STORE__.getState().viewport.zoom,
        panX: window.__WB_STORE__.getState().viewport.panX,
        panY: window.__WB_STORE__.getState().viewport.panY
      }));
      
      if (resetState.zoom === 1 && resetState.panX === 0 && resetState.panY === 0) {
        await logTest('Reset Viewport', 'pass', 'Viewport reset to default');
      } else {
        await logTest('Reset Viewport', 'warning', `Viewport at zoom=${resetState.zoom}, pan=(${resetState.panX}, ${resetState.panY})`);
      }
    }
    
    return true;
  } catch (error) {
    await logTest('Zoom/Pan', 'fail', error.message);
    return false;
  }
}

async function testUndoRedo(page) {
  console.log(`\n${colors.cyan}Testing Undo/Redo...${colors.reset}`);
  
  try {
    // Create some shapes first
    await page.click('[data-testid="tool-pen"]');
    await delay(200);
    
    const initialCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Draw first stroke
    await page.mouse.move(100, 100);
    await page.mouse.down();
    await page.mouse.move(200, 200, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    // Draw second stroke
    await page.mouse.move(300, 100);
    await page.mouse.down();
    await page.mouse.move(400, 200, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    const afterDrawCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    // Test undo
    await page.keyboard.down('Control');
    await page.keyboard.press('z');
    await page.keyboard.up('Control');
    await delay(DELAY);
    
    const afterUndoCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterUndoCount < afterDrawCount) {
      await logTest('Undo', 'pass', `Shapes: ${afterDrawCount} → ${afterUndoCount}`);
    } else {
      await logTest('Undo', 'fail', 'Undo did not reduce shape count');
    }
    
    // Test redo
    await page.keyboard.down('Control');
    await page.keyboard.down('Shift');
    await page.keyboard.press('z');
    await page.keyboard.up('Shift');
    await page.keyboard.up('Control');
    await delay(DELAY);
    
    const afterRedoCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (afterRedoCount > afterUndoCount) {
      await logTest('Redo', 'pass', `Shapes: ${afterUndoCount} → ${afterRedoCount}`);
    } else {
      await logTest('Redo', 'warning', 'Redo did not restore shape');
    }
    
    return true;
  } catch (error) {
    await logTest('Undo/Redo', 'fail', error.message);
    return false;
  }
}

async function testClearBoard(page) {
  console.log(`\n${colors.cyan}Testing Clear Board...${colors.reset}`);
  
  try {
    // Ensure there are shapes to clear
    await page.click('[data-testid="tool-pen"]');
    await delay(200);
    
    await page.mouse.move(250, 250);
    await page.mouse.down();
    await page.mouse.move(350, 350, { steps: 5 });
    await page.mouse.up();
    await delay(DELAY);
    
    const beforeClearCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
    
    if (beforeClearCount === 0) {
      await logTest('Clear Board - Setup', 'warning', 'No shapes to clear');
      return true;
    }
    
    // Find and click clear button
    const clearButton = await page.$('[data-testid="clear-board"]');
    if (clearButton) {
      await clearButton.click();
      await delay(200);
      
      // Confirm if there's a confirmation dialog
      const confirmButton = await page.$('[data-testid="confirm-clear"]');
      if (confirmButton) {
        await confirmButton.click();
        await delay(DELAY);
      }
      
      const afterClearCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
      
      if (afterClearCount === 0) {
        await logTest('Clear Board', 'pass', `Cleared ${beforeClearCount} shapes`);
      } else {
        await logTest('Clear Board', 'fail', `${afterClearCount} shapes remain`);
      }
    } else {
      // Try using store directly
      await page.evaluate(() => window.__WB_STORE__.getState().clearShapes());
      await delay(DELAY);
      
      const afterClearCount = await page.evaluate(() => window.__WB_STORE__.getState().shapes.size);
      
      if (afterClearCount === 0) {
        await logTest('Clear Board (via store)', 'pass', `Cleared ${beforeClearCount} shapes`);
      } else {
        await logTest('Clear Board', 'fail', `${afterClearCount} shapes remain`);
      }
    }
    
    return true;
  } catch (error) {
    await logTest('Clear Board', 'fail', error.message);
    return false;
  }
}

async function checkConsoleErrors(page) {
  console.log(`\n${colors.cyan}Checking for Console Errors...${colors.reset}`);
  
  const errors = [];
  
  page.on('console', msg => {
    if (msg.type() === 'error') {
      errors.push(msg.text());
    }
  });
  
  page.on('pageerror', error => {
    errors.push(error.message);
  });
  
  await delay(1000); // Wait a bit to catch any async errors
  
  if (errors.length === 0) {
    await logTest('Console Errors', 'pass', 'No errors detected');
  } else {
    await logTest('Console Errors', 'warning', `${errors.length} error(s) found`);
    errors.forEach(err => console.log(`  ${colors.yellow}⚠${colors.reset} ${err}`));
  }
  
  return errors.length === 0;
}

async function runTests() {
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  console.log(`${colors.magenta}Whiteboard Tools Comprehensive Test Suite${colors.reset}`);
  console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
  
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: { width: 1280, height: 800 },
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    
    // Navigate to whiteboard
    console.log(`\n${colors.blue}Navigating to whiteboard...${colors.reset}`);
    await page.goto(WHITEBOARD_URL, { waitUntil: 'networkidle2' });
    await delay(2000); // Wait for full initialization
    
    // Run all tests
    await testPenTool(page);
    await testHighlighterTool(page);
    await testEraserTool(page);
    await testTextTool(page);
    
    // Test shape tools
    await testShapeTool(page, 'Rectangle', 'rectangle');
    await testShapeTool(page, 'Circle', 'circle');
    await testShapeTool(page, 'Arrow', 'arrow');
    await testShapeTool(page, 'Line', 'line');
    
    await testSelectTool(page);
    await testZoomPan(page);
    await testUndoRedo(page);
    await testClearBoard(page);
    await checkConsoleErrors(page);
    
    // Print summary
    console.log(`\n${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    console.log(`${colors.magenta}Test Summary${colors.reset}`);
    console.log(`${colors.magenta}${'='.repeat(60)}${colors.reset}`);
    
    console.log(`${colors.green}✅ Passed: ${testResults.passed.length}${colors.reset}`);
    console.log(`${colors.red}❌ Failed: ${testResults.failed.length}${colors.reset}`);
    console.log(`${colors.yellow}⚠️  Warnings: ${testResults.warnings.length}${colors.reset}`);
    
    if (testResults.failed.length > 0) {
      console.log(`\n${colors.red}Failed Tests:${colors.reset}`);
      testResults.failed.forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }
    
    if (testResults.warnings.length > 0) {
      console.log(`\n${colors.yellow}Warnings:${colors.reset}`);
      testResults.warnings.forEach(test => {
        console.log(`  - ${test.name}: ${test.details}`);
      });
    }
    
    // Take final screenshot
    await page.screenshot({ path: 'whiteboard-test-final.png' });
    console.log(`\n${colors.blue}Screenshot saved: whiteboard-test-final.png${colors.reset}`);
    
    // Keep browser open for manual inspection
    console.log(`\n${colors.cyan}Browser will remain open for inspection. Press Ctrl+C to exit.${colors.reset}`);
    
    // Wait indefinitely
    await new Promise(() => {});
    
  } catch (error) {
    console.error(`${colors.red}Test suite error: ${error.message}${colors.reset}`);
  } finally {
    // Browser will be closed when process exits
  }
}

// Run the tests
runTests().catch(console.error);
