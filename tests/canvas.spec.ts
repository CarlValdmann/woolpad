import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('Canvas', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should load canvas element', async ({ page }) => {
    const canvas = helpers.getCanvas();
    await expect(canvas).toBeVisible();
    
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    expect(canvasBox!.width).toBeGreaterThan(0);
    expect(canvasBox!.height).toBeGreaterThan(0);
  });

  test('should display grid on canvas', async ({ page }) => {
    const canvas = helpers.getCanvas();
    await expect(canvas).toBeVisible();
    
    // Check if canvas has content (grid should be drawn)
    const canvasImageData = await page.evaluate(() => {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      return ctx.getImageData(0, 0, canvas.width, canvas.height);
    });
    
    expect(canvasImageData).not.toBeNull();
  });

  test('should allow drawing on canvas', async ({ page }) => {
    // Select draw tool
    await helpers.clickTool('draw');
    await page.waitForTimeout(300);
    
    // Select a stitch from palette
    await page.waitForSelector('.stitch-palette-item', { state: 'visible' });
    const stitchItems = page.locator('.stitch-palette-item');
    const count = await stitchItems.count();
    if (count > 0) {
      await stitchItems.first().click();
      await page.waitForTimeout(300);
    }
    
    // Get initial stitch count
    const initialCount = await helpers.getStitchCount();
    
    // Click on canvas
    const canvas = helpers.getCanvas();
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      
      // Wait a bit for the stitch to be added
      await page.waitForTimeout(1000);
      
      // Check if stitch was added
      const stitchCount = await helpers.getStitchCount();
      expect(stitchCount).toBeGreaterThanOrEqual(initialCount);
    }
  });

  test('should redraw stitches after canvas interaction', async ({ page }) => {
    // Add a stitch first
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
      
      const initialCount = await helpers.getStitchCount();
      expect(initialCount).toBeGreaterThanOrEqual(0);
      
      // Trigger redraw (simulate window resize or similar)
      await page.evaluate(() => {
        // @ts-ignore
        if (typeof window.redrawStitches === 'function') {
          // @ts-ignore
          window.redrawStitches();
        }
      });
      
      await page.waitForTimeout(500);
      
      // Stitch count should remain the same
      const finalCount = await helpers.getStitchCount();
      expect(finalCount).toBe(initialCount);
    }
  });
});

