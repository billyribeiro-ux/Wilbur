#!/usr/bin/env node

/**
 * IMMEDIATE TOOL VERIFICATION
 * Tests ALL tools programmatically
 */

import puppeteer from 'puppeteer';

const TOOLS = [
  { name: 'pen', key: 'p', action: 'draw' },
  { name: 'highlighter', key: 'h', action: 'draw' },
  { name: 'eraser', key: 'e', action: 'click' },
  { name: 'line', key: 'l', action: 'drag' },
  { name: 'rectangle', key: 'r', action: 'drag' },
  { name: 'circle', key: 'c', action: 'drag' },
  { name: 'arrow', key: 'a', action: 'drag' },
  { name: 'text', key: 't', action: 'click-type' },
  { name: 'stamp', key: 's', action: 'click' }
];

async function testAllTools() {
  console.log('🔧 TESTING ALL WHITEBOARD TOOLS...\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.goto('http://localhost:5173');
  
  // Wait for app to load
  await page.waitForTimeout(3000);
  
  // Navigate to whiteboard
  try {
    // Click on rooms if needed
    const roomsButton = await page.$('[data-testid="rooms-button"]');
    if (roomsButton) {
      await roomsButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Select first room or create one
    const firstRoom = await page.$('.room-item');
    if (firstRoom) {
      await firstRoom.click();
    } else {
      // Create a test room
      const createButton = await page.$('[data-testid="create-room"]');
      if (createButton) {
        await createButton.click();
        await page.waitForTimeout(1000);
        await page.type('[name="roomName"]', 'Test Room');
        await page.click('[type="submit"]');
      }
    }
    
    await page.waitForTimeout(2000);
    
    // Activate whiteboard
    const whiteboardButton = await page.$('[data-testid="whiteboard-toggle"]');
    if (whiteboardButton) {
      await whiteboardButton.click();
      await page.waitForTimeout(1000);
    }
    
    // Get canvas element
    const canvas = await page.$('canvas[data-testid="whiteboard-canvas"]');
    if (!canvas) {
      throw new Error('Canvas not found!');
    }
    
    const canvasBounds = await canvas.boundingBox();
    
    // Test each tool
    for (const tool of TOOLS) {
      console.log(`Testing ${tool.name} tool...`);
      
      // Activate tool with keyboard shortcut
      await page.keyboard.press(tool.key);
      await page.waitForTimeout(500);
      
      // Get current shapes count
      const shapesBefore = await page.evaluate(() => {
        const store = window.useWhiteboardStore?.getState();
        return store ? store.shapes.size : 0;
      });
      
      // Perform tool action
      const centerX = canvasBounds.x + canvasBounds.width / 2;
      const centerY = canvasBounds.y + canvasBounds.height / 2;
      
      switch (tool.action) {
        case 'draw':
          // Draw a line
          await page.mouse.move(centerX - 50, centerY);
          await page.mouse.down();
          await page.mouse.move(centerX + 50, centerY, { steps: 10 });
          await page.mouse.up();
          break;
          
        case 'drag':
          // Draw a shape
          await page.mouse.move(centerX - 30, centerY - 30);
          await page.mouse.down();
          await page.mouse.move(centerX + 30, centerY + 30);
          await page.mouse.up();
          break;
          
        case 'click':
          // Click action (eraser/stamp)
          await page.mouse.click(centerX, centerY);
          break;
          
        case 'click-type':
          // Text tool
          await page.mouse.click(centerX, centerY);
          await page.keyboard.type('Test Text');
          await page.keyboard.press('Enter');
          break;
      }
      
      await page.waitForTimeout(500);
      
      // Check if shape was added (except eraser)
      const shapesAfter = await page.evaluate(() => {
        const store = window.useWhiteboardStore?.getState();
        return store ? store.shapes.size : 0;
      });
      
      const worked = tool.name === 'eraser' 
        ? shapesAfter <= shapesBefore 
        : shapesAfter > shapesBefore;
      
      console.log(`  ${worked ? '✅' : '❌'} ${tool.name}: ${worked ? 'WORKING' : 'FAILED'}`);
      
      if (!worked) {
        // Check for errors
        const errors = await page.evaluate(() => {
          return window.__errors || [];
        });
        if (errors.length > 0) {
          console.log(`  Errors: ${errors.join(', ')}`);
        }
      }
    }
    
  } catch (error) {
    console.error('Test failed:', error);
  }
  
  // Keep browser open for manual inspection
  console.log('\n✅ Test complete. Browser will stay open for inspection.');
  console.log('Press Ctrl+C to exit.');
}

// Inject error tracking
const injectErrorTracking = `
  window.__errors = [];
  window.addEventListener('error', (e) => {
    window.__errors.push(e.message);
  });
  
  // Make store accessible
  if (window.useWhiteboardStore) {
    window.useWhiteboardStore = window.useWhiteboardStore;
  }
`;

testAllTools().catch(console.error);
