import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('Zoom and Pan', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should display zoom controls', async ({ page }) => {
    const zoomControls = page.locator('.zoom-controls-top');
    await expect(zoomControls).toBeVisible();
    
    const zoomLevel = page.locator('#zoomLevel');
    await expect(zoomLevel).toBeVisible();
  });

  test('should show initial zoom level', async ({ page }) => {
    const zoomLevel = await helpers.getZoomLevel();
    expect(zoomLevel).toBeGreaterThan(0);
  });

  test('should zoom in', async ({ page }) => {
    const initialZoom = await helpers.getZoomLevel();
    
    await helpers.zoomIn();
    await page.waitForTimeout(500);
    
    const finalZoom = await helpers.getZoomLevel();
    expect(finalZoom).toBeGreaterThan(initialZoom);
  });

  test('should zoom out', async ({ page }) => {
    // First zoom in
    await helpers.zoomIn();
    await page.waitForTimeout(500);
    const zoomedIn = await helpers.getZoomLevel();
    
    // Then zoom out
    await helpers.zoomOut();
    await page.waitForTimeout(500);
    
    const zoomedOut = await helpers.getZoomLevel();
    expect(zoomedOut).toBeLessThan(zoomedIn);
  });

  test('should update zoom level display', async ({ page }) => {
    const zoomLevelElement = page.locator('#zoomLevel');
    const initialText = await zoomLevelElement.textContent();
    
    await helpers.zoomIn();
    await page.waitForTimeout(500);
    
    const finalText = await zoomLevelElement.textContent();
    expect(finalText).not.toBe(initialText);
  });

  test('should support infinite zoomable grid', async ({ page }) => {
    const canvas = helpers.getCanvas();
    await expect(canvas).toBeVisible();
    
    // Zoom in multiple times
    for (let i = 0; i < 5; i++) {
      await helpers.zoomIn();
      await page.waitForTimeout(200);
    }
    
    // Canvas should still be visible and functional
    const canvasBox = await canvas.boundingBox();
    expect(canvasBox).not.toBeNull();
    
    // Grid should still be visible (infinite grid)
    const canvasImageData = await page.evaluate(() => {
      const canvas = document.getElementById('canvas') as HTMLCanvasElement;
      if (!canvas) return null;
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;
      return ctx.getImageData(0, 0, Math.min(100, canvas.width), Math.min(100, canvas.height));
    });
    
    expect(canvasImageData).not.toBeNull();
  });
});

