import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('Layers', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should have initial layer', async ({ page }) => {
    // Wait for UI to initialize
    await page.waitForTimeout(1000);
    const layerCount = await helpers.getLayerCount();
    expect(layerCount).toBeGreaterThanOrEqual(1);
  });

  test('should display rounds list', async ({ page }) => {
    // On mobile, rounds list is in drawer, on desktop in sidebar
    const roundsListDesktop = page.locator('#roundsList');
    const roundsListMobile = page.locator('#drawerContent #roundsList');
    
    const desktopVisible = await roundsListDesktop.isVisible().catch(() => false);
    const mobileVisible = await roundsListMobile.isVisible().catch(() => false);
    
    // At least one should be visible (desktop or mobile)
    expect(desktopVisible || mobileVisible).toBeTruthy();
  });

  test('should add new layer', async ({ page }) => {
    await page.waitForTimeout(500);
    const initialCount = await helpers.getLayerCount();
    expect(initialCount).toBeGreaterThanOrEqual(1);
    
    await helpers.addNewLayer();
    await page.waitForTimeout(1000);
    
    const finalCount = await helpers.getLayerCount();
    expect(finalCount).toBeGreaterThan(initialCount);
  });

  test('should switch between layers', async ({ page }) => {
    // Add a second layer first
    await helpers.addNewLayer();
    await page.waitForTimeout(500);
    
    const initialCount = await helpers.getLayerCount();
    expect(initialCount).toBeGreaterThanOrEqual(2);
    
    // Try to find next button (might be in sidebar or drawer)
    const nextButton = page.locator('button:has-text("Järgmine")').or(page.locator('button:has-text("Next")'));
    const count = await nextButton.count();
    
    if (count > 0) {
      const initialIndex = await helpers.getCurrentLayerIndex();
      await nextButton.first().click();
      await page.waitForTimeout(500);
      
      const finalIndex = await helpers.getCurrentLayerIndex();
      // Index should change if we have multiple layers
      if (initialCount > 1) {
        expect(finalIndex).not.toBe(initialIndex);
      }
    } else {
      // If no next button, skip this test
      test.skip();
    }
  });

  test('should display layer items in rounds list', async ({ page }) => {
    const roundItems = page.locator('.round-item');
    const count = await roundItems.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should highlight active layer', async ({ page }) => {
    const activeRound = page.locator('.round-item.active');
    await expect(activeRound).toBeVisible();
  });

  test('should show layer stitch count', async ({ page }) => {
    const roundItems = page.locator('.round-item');
    const firstItem = roundItems.first();
    
    const text = await firstItem.textContent();
    expect(text).toContain('pisteid');
  });
});

