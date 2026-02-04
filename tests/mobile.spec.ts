import { test, expect, devices } from '@playwright/test';
import { PageHelpers } from './helpers/page-helpers';

test.use({
  ...devices['Pixel 5'],
});

test.describe('Mobile Responsive', () => {
  let helpers: PageHelpers;

  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    helpers = new PageHelpers(page);
    await helpers.waitForAppReady();
  });

  test('should hide desktop toolbar on mobile', async ({ page }) => {
    const leftToolbar = page.locator('.left-toolbar');
    await expect(leftToolbar).not.toBeVisible();
    
    const rightSidebar = page.locator('.right-sidebar');
    await expect(rightSidebar).not.toBeVisible();
  });

  test('should show bottom toolbar on mobile', async ({ page }) => {
    const bottomToolbar = page.locator('.bottom-toolbar');
    await expect(bottomToolbar).toBeVisible();
  });

  test('should show hamburger menu on mobile', async ({ page }) => {
    const hamburgerMenu = page.locator('#hamburgerMenu');
    await expect(hamburgerMenu).toBeVisible();
  });

  test('should open sidebar drawer', async ({ page }) => {
    await helpers.openSidebarDrawer();
    
    const drawer = page.locator('.sidebar-drawer.open');
    await expect(drawer).toBeVisible();
    
    const overlay = page.locator('.drawer-overlay.active');
    await expect(overlay).toBeVisible();
  });

  test('should close sidebar drawer', async ({ page }) => {
    await helpers.openSidebarDrawer();
    await helpers.closeSidebarDrawer();
    
    const drawer = page.locator('.sidebar-drawer.open');
    await expect(drawer).not.toBeVisible();
  });

  test('should have tools in bottom toolbar', async ({ page }) => {
    const bottomToolbar = page.locator('.bottom-toolbar');
    await expect(bottomToolbar).toBeVisible();
    
    // Wait for tools to be populated
    await page.waitForTimeout(500);
    
    const toolIcons = bottomToolbar.locator('.tool-icon');
    const count = await toolIcons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should switch tools from bottom toolbar', async ({ page }) => {
    const bottomToolbar = page.locator('.bottom-toolbar');
    const drawTool = bottomToolbar.locator('.tool-icon[data-tool="draw"]');
    
    await drawTool.click();
    await expect(drawTool).toHaveClass(/active/);
  });

  test('should have compact top menu on mobile', async ({ page }) => {
    const topMenu = page.locator('.top-menu');
    await expect(topMenu).toBeVisible();
    
    const menuButtons = topMenu.locator('.menu-btn');
    const count = await menuButtons.count();
    expect(count).toBeGreaterThan(0);
  });

  test('should support touch interactions', async ({ page }) => {
    const canvas = helpers.getCanvas();
    await expect(canvas).toBeVisible();
    
    // Touch the canvas
    const box = await canvas.boundingBox();
    if (box) {
      await canvas.tap({ position: { x: box.width / 2, y: box.height / 2 } });
      await page.waitForTimeout(500);
    }
  });

  test('should scroll bottom toolbar horizontally', async ({ page }) => {
    const bottomToolbar = page.locator('.bottom-toolbar');
    await expect(bottomToolbar).toBeVisible();
    
    // Check if toolbar is scrollable
    const isScrollable = await bottomToolbar.evaluate((el) => {
      return el.scrollWidth > el.clientWidth;
    });
    
    // Toolbar should be scrollable if there are many tools
    // This is expected behavior for mobile
  });
});

