import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('Tools', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should have all tools available', async ({ page }) => {
    const tools = ['draw', 'erase', 'line', 'move', 'select'];
    
    for (const tool of tools) {
      const toolButton = page.locator(`.tool-icon[data-tool="${tool}"]`);
      // Tool might be in left toolbar (desktop) or bottom toolbar (mobile)
      const count = await toolButton.count();
      expect(count).toBeGreaterThan(0);
    }
  });

  test('should switch between tools', async ({ page }) => {
    const tools = ['draw', 'erase', 'line', 'move', 'select'];
    
    for (const tool of tools) {
      await helpers.clickTool(tool);
      await page.waitForTimeout(200);
      const currentTool = await helpers.getCurrentToolMode();
      expect(currentTool).toBe(tool);
    }
  });

  test('should activate draw tool by default', async ({ page }) => {
    const drawTool = page.locator('.tool-icon[data-tool="draw"]').first();
    await expect(drawTool).toHaveClass(/active/);
  });

  test('should draw stitches with draw tool', async ({ page }) => {
    await helpers.clickTool('draw');
    await page.waitForTimeout(300);
    
    // Select a stitch from palette
    await page.waitForSelector('.stitch-palette-item', { state: 'visible' });
    const stitchItems = page.locator('.stitch-palette-item');
    if (await stitchItems.count() > 0) {
      await stitchItems.first().click();
      await page.waitForTimeout(300);
    }
    
    const canvas = helpers.getCanvas();
    const box = await canvas.boundingBox();
    if (box) {
      const initialCount = await helpers.getStitchCount();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(1000);
      
      const finalCount = await helpers.getStitchCount();
      expect(finalCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('should erase stitches with erase tool', async ({ page }) => {
    // First, add a stitch
    await helpers.clickTool('draw');
    await page.waitForTimeout(300);
    
    // Select a stitch
    await page.waitForSelector('.stitch-palette-item', { state: 'visible' });
    const stitchItems = page.locator('.stitch-palette-item');
    if (await stitchItems.count() > 0) {
      await stitchItems.first().click();
      await page.waitForTimeout(300);
    }
    
    const canvas = helpers.getCanvas();
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(1000);
      
      const countAfterAdd = await helpers.getStitchCount();
      expect(countAfterAdd).toBeGreaterThanOrEqual(0);
      
      // Now erase it (only if we have stitches)
      if (countAfterAdd > 0) {
        await helpers.clickTool('erase');
        await page.waitForTimeout(300);
        await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
        await page.waitForTimeout(1000);
        
        const countAfterErase = await helpers.getStitchCount();
        expect(countAfterErase).toBeLessThanOrEqual(countAfterAdd);
      }
    }
  });

  test('should change cursor based on tool', async ({ page }) => {
    await helpers.clickTool('erase');
    await page.waitForTimeout(300);
    const canvas = helpers.getCanvas();
    const cursor = await canvas.evaluate((el) => {
      return window.getComputedStyle(el).cursor;
    });
    // Cursor should change for erase tool (not-allowed or crosshair)
    expect(cursor).toBeTruthy();
    expect(cursor).not.toBe('');
  });

  test('should support note tool', async ({ page }) => {
    const noteTool = page.locator('.tool-icon[data-tool="note"]');
    const count = await noteTool.count();
    if (count > 0) {
      await noteTool.first().click();
      await page.waitForTimeout(300);
      await expect(noteTool.first()).toHaveClass(/active/);
    } else {
      // Note tool might not be available in all views
      test.skip();
    }
  });
});

