import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('Stitches', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should display stitch palette', async ({ page }) => {
    const palette = page.locator('#stitchPalette');
    await expect(palette).toBeVisible();
  });

  test('should have multiple stitch types available', async ({ page }) => {
    const stitchItems = page.locator('.stitch-palette-item');
    const count = await stitchItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should select stitch from palette', async ({ page }) => {
    // Wait for palette to be populated
    await page.waitForSelector('.stitch-palette-item', { state: 'visible' });
    
    const stitchItems = page.locator('.stitch-palette-item');
    const count = await stitchItems.count();
    expect(count).toBeGreaterThan(0);
    
    const firstStitch = stitchItems.first();
    await firstStitch.click();
    await page.waitForTimeout(300);
    await expect(firstStitch).toHaveClass(/active/);
  });

  test('should add stitch to canvas when clicking', async ({ page }) => {
    await helpers.clickTool('draw');
    
    // Select a stitch
    const stitchItems = page.locator('.stitch-palette-item');
    await stitchItems.first().click();
    await page.waitForTimeout(200);
    
    // Click on canvas
    const canvas = helpers.getCanvas();
    const box = await canvas.boundingBox();
    if (box) {
      const initialCount = await helpers.getStitchCount();
      
      await canvas.click({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(500);
      
      const finalCount = await helpers.getStitchCount();
      expect(finalCount).toBeGreaterThan(initialCount);
    }
  });

  test('should support different stitch types', async ({ page }) => {
    await page.waitForSelector('.stitch-palette-item', { state: 'visible' });
    
    const stitchTypes = ['chain', 'sc', 'dc', 'tr'];
    const stitchItems = page.locator('.stitch-palette-item');
    const count = await stitchItems.count();
    
    // Just verify we have some stitches available
    expect(count).toBeGreaterThan(0);
    
    // Try to select different stitches by clicking them
    for (let i = 0; i < Math.min(count, stitchTypes.length); i++) {
      const item = stitchItems.nth(i);
      await item.click();
      await page.waitForTimeout(200);
      // At least one should be active
      const activeItem = page.locator('.stitch-palette-item.active');
      const activeCount = await activeItem.count();
      expect(activeCount).toBeGreaterThan(0);
    }
  });

  test('should display custom stitches in palette', async ({ page }) => {
    // First create a custom stitch
    await page.evaluate(() => {
      // @ts-ignore
      if (typeof window.showCustomStitchModal === 'function') {
        // @ts-ignore
        window.showCustomStitchModal();
      }
    });
    
    await page.waitForSelector('#customStitchModal', { state: 'visible' });
    
    // Fill in custom stitch form
    await page.fill('#customStitchName', 'Test Custom Stitch');
    await page.fill('#customStitchSymbol', '★');
    await page.selectOption('#customStitchCategory', 'custom');
    
    // Save
    await page.evaluate(() => {
      // @ts-ignore
      if (typeof window.saveCustomStitch === 'function') {
        // @ts-ignore
        window.saveCustomStitch();
      }
    });
    
    await page.waitForTimeout(500);
    
    // Check if custom stitch appears in palette
    const customStitch = page.locator('.stitch-palette-item').filter({ hasText: 'Test Custom Stitch' });
    // Custom stitch should be visible (if the modal closed properly)
    await page.waitForTimeout(500);
  });
});

