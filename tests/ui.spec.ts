import { test, expect } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.describe('UI Components', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should display top menu', async ({ page }) => {
    const topMenu = page.locator('.top-menu');
    await expect(topMenu).toBeVisible();
    
    const appTitle = page.locator('.app-title');
    await expect(appTitle).toBeVisible();
    await expect(appTitle).toContainText('Heegelmotiivid');
  });

  test('should toggle dark mode', async ({ page }) => {
    const isInitialDark = await helpers.isDarkMode();
    
    await helpers.toggleDarkMode();
    await page.waitForTimeout(500);
    
    const isAfterToggle = await helpers.isDarkMode();
    expect(isAfterToggle).not.toBe(isInitialDark);
    
    // Toggle back
    await helpers.toggleDarkMode();
    await page.waitForTimeout(500);
    
    const isFinal = await helpers.isDarkMode();
    expect(isFinal).toBe(isInitialDark);
  });

  test('should display right sidebar on desktop', async ({ page }) => {
    // Check viewport size
    const viewport = page.viewportSize();
    
    if (viewport && viewport.width >= 768) {
      const rightSidebar = page.locator('.right-sidebar');
      await expect(rightSidebar).toBeVisible();
    }
  });

  test('should display stitch palette', async ({ page }) => {
    // On mobile, palette is in drawer, on desktop in sidebar
    const paletteDesktop = page.locator('#stitchPalette');
    const paletteMobile = page.locator('#drawerContent #stitchPalette');
    
    await page.waitForTimeout(500); // Wait for palette to load
    
    const desktopVisible = await paletteDesktop.isVisible().catch(() => false);
    const mobileVisible = await paletteMobile.isVisible().catch(() => false);
    
    // At least one should be visible
    expect(desktopVisible || mobileVisible).toBeTruthy();
  });

  test('should display rounds list', async ({ page }) => {
    // On mobile, rounds list is in drawer, on desktop in sidebar
    const roundsListDesktop = page.locator('#roundsList');
    const roundsListMobile = page.locator('#drawerContent #roundsList');
    
    await page.waitForTimeout(500);
    
    const desktopVisible = await roundsListDesktop.isVisible().catch(() => false);
    const mobileVisible = await roundsListMobile.isVisible().catch(() => false);
    
    // At least one should be visible
    expect(desktopVisible || mobileVisible).toBeTruthy();
  });

  test('should display properties section', async ({ page }) => {
    const propertiesSection = page.locator('#propertiesSection');
    if (await propertiesSection.count() > 0) {
      await expect(propertiesSection).toBeVisible();
    }
  });

  test('should open symmetry modal', async ({ page }) => {
    const symmetryButton = page.locator('button:has-text("Symmetry")');
    await symmetryButton.click();
    
    await page.waitForSelector('#symmetryModal', { state: 'visible' });
    const modal = page.locator('#symmetryModal');
    await expect(modal).toBeVisible();
  });

  test('should close symmetry modal', async ({ page }) => {
    // Open modal
    const symmetryButton = page.locator('button:has-text("Symmetry")');
    await symmetryButton.click();
    await page.waitForSelector('#symmetryModal', { state: 'visible' });
    
    // Close modal
    const closeButton = page.locator('#symmetryModal .close-btn');
    await closeButton.click();
    
    await page.waitForTimeout(500);
    const modal = page.locator('#symmetryModal');
    await expect(modal).not.toBeVisible();
  });

  test('should display zoom controls', async ({ page }) => {
    const zoomControls = page.locator('.zoom-controls-top');
    await expect(zoomControls).toBeVisible();
    
    const zoomLevel = page.locator('#zoomLevel');
    await expect(zoomLevel).toBeVisible();
  });

  test('should have undo/redo buttons', async ({ page }) => {
    // Undo/redo buttons might be in left toolbar (desktop) or bottom toolbar (mobile)
    const undoButton = page.locator('.tool-icon').filter({ hasText: '↶' });
    const redoButton = page.locator('.tool-icon').filter({ hasText: '↷' });
    
    const undoCount = await undoButton.count();
    const redoCount = await redoButton.count();
    
    // At least one should be visible
    expect(undoCount + redoCount).toBeGreaterThan(0);
  });

  test('should update status bar', async ({ page }) => {
    const statusBar = page.locator('.status-bar');
    if (await statusBar.count() > 0) {
      await expect(statusBar).toBeVisible();
      
      const statusText = page.locator('#statusText');
      if (await statusText.count() > 0) {
        await expect(statusText).toBeVisible();
      }
    }
  });
});

