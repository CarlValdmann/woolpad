import { Page, expect } from '@playwright/test';

/**
 * Helper functions for interacting with the crochet pattern editor
 */
export class PageHelpers {
  constructor(private page: Page) {}

  /**
   * Wait for the application to be fully loaded
   */
  async waitForAppReady(): Promise<void> {
    await this.page.waitForSelector('#canvas', { state: 'visible' });
    await this.page.waitForFunction(() => {
      return typeof window.setToolMode === 'function';
    });
    // Wait a bit more for async initialization
    await this.page.waitForTimeout(1000);
  }

  /**
   * Click on a tool in the left toolbar
   */
  async clickTool(toolId: string): Promise<void> {
    const toolButton = this.page.locator(`.tool-icon[data-tool="${toolId}"]`);
    await toolButton.click();
    await expect(toolButton).toHaveClass(/active/);
  }

  /**
   * Click on canvas at specific coordinates
   */
  async clickCanvas(x: number, y: number): Promise<void> {
    const canvas = this.page.locator('#canvas');
    await canvas.click({ position: { x, y } });
  }

  /**
   * Get canvas element
   */
  getCanvas() {
    return this.page.locator('#canvas');
  }

  /**
   * Select a stitch from the palette
   */
  async selectStitch(stitchId: string): Promise<void> {
    // Stitch items don't have data-stitch attribute, we need to find by title or click all and check which one becomes active
    const stitchItems = this.page.locator('.stitch-palette-item');
    const count = await stitchItems.count();
    
    // Try to find by title (stitch name)
    for (let i = 0; i < count; i++) {
      const item = stitchItems.nth(i);
      const title = await item.getAttribute('title');
      if (title && title.toLowerCase().includes(stitchId.toLowerCase())) {
        await item.click();
        await this.page.waitForTimeout(300);
        // Verify it's active
        const isActive = await item.evaluate((el) => el.classList.contains('active'));
        if (isActive) return;
      }
    }
    
    // Fallback: click first item if we can't find by name
    if (count > 0) {
      await stitchItems.first().click();
      await this.page.waitForTimeout(300);
    }
  }

  /**
   * Get current tool mode
   */
  async getCurrentToolMode(): Promise<string> {
    return await this.page.evaluate(() => {
      const activeTool = document.querySelector('.tool-icon.active');
      return activeTool?.getAttribute('data-tool') || '';
    });
  }

  /**
   * Get number of stitches on canvas
   */
  async getStitchCount(): Promise<number> {
    return await this.page.evaluate(async () => {
      try {
        // Try to access state via window (exported in main.js)
        // @ts-ignore
        if (window.state && window.state.layers) {
          // @ts-ignore
          const layer = window.state.layers[window.state.currentLayerIndex || 0];
          return layer?.stitches?.length || 0;
        }
        
        // Fallback: try to get from UI
        const roundsList = document.getElementById('roundsList');
        if (roundsList) {
          const activeRound = roundsList.querySelector('.round-item.active');
          if (activeRound) {
            const countText = activeRound.textContent;
            const match = countText?.match(/(\d+)\s*pisteid/);
            if (match) {
              return parseInt(match[1], 10);
            }
          }
        }
        
        return 0;
      } catch (e) {
        return 0;
      }
    });
  }

  /**
   * Get current layer index
   */
  async getCurrentLayerIndex(): Promise<number> {
    return await this.page.evaluate(() => {
      try {
        // @ts-ignore
        if (window.state && typeof window.state.currentLayerIndex === 'number') {
          // @ts-ignore
          return window.state.currentLayerIndex;
        }
        return 0;
      } catch (e) {
        return 0;
      }
    });
  }

  /**
   * Get zoom level
   */
  async getZoomLevel(): Promise<number> {
    const zoomText = await this.page.locator('#zoomLevel').textContent();
    if (zoomText) {
      return parseFloat(zoomText.replace('%', ''));
    }
    return 100;
  }

  /**
   * Click zoom in button
   */
  async zoomIn(): Promise<void> {
    await this.page.locator('.zoom-btn-top').last().click();
  }

  /**
   * Click zoom out button
   */
  async zoomOut(): Promise<void> {
    await this.page.locator('.zoom-btn-top').first().click();
  }

  /**
   * Toggle dark mode
   */
  async toggleDarkMode(): Promise<void> {
    await this.page.locator('#darkModeToggle').click();
  }

  /**
   * Check if dark mode is active
   */
  async isDarkMode(): Promise<boolean> {
    return await this.page.evaluate(() => {
      return document.body.classList.contains('dark-mode');
    });
  }

  /**
   * Open sidebar drawer (mobile)
   */
  async openSidebarDrawer(): Promise<void> {
    await this.page.locator('#hamburgerMenu').click();
    await this.page.waitForSelector('.sidebar-drawer.open', { state: 'visible' });
  }

  /**
   * Close sidebar drawer (mobile)
   */
  async closeSidebarDrawer(): Promise<void> {
    await this.page.locator('.drawer-close').click();
    await this.page.waitForSelector('.sidebar-drawer.open', { state: 'hidden' });
  }

  /**
   * Add a new layer
   */
  async addNewLayer(): Promise<void> {
    await this.page.evaluate(() => {
      // @ts-ignore
      if (typeof window.addNewLayer === 'function') {
        // @ts-ignore
        window.addNewLayer();
      }
    });
    await this.page.waitForTimeout(500);
  }

  /**
   * Get number of layers
   */
  async getLayerCount(): Promise<number> {
    return await this.page.evaluate(() => {
      try {
        // @ts-ignore
        if (window.state && window.state.layers && Array.isArray(window.state.layers)) {
          // @ts-ignore
          return window.state.layers.length;
        }
        return 1; // Default: at least one layer exists
      } catch (e) {
        return 1;
      }
    });
  }
}

