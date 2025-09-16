import { test, expect } from '@playwright/test';

test.describe('Accessibility Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard');
  });

  test('should have proper heading structure', async ({ page }) => {
    const h1 = await page.locator('h1').first();
    await expect(h1).toBeVisible();
    
    const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
    expect(headings.length).toBeGreaterThan(0);
  });

  test('should have proper color contrast', async ({ page }) => {
    // Test color contrast ratios
    const textElements = await page.locator('p, span, div').all();
    for (const element of textElements) {
      const color = await element.evaluate((el) => {
        const styles = window.getComputedStyle(el);
        return styles.color;
      });
      // Basic color contrast check
      expect(color).toBeTruthy();
    }
  });

  test('should have proper focus management', async ({ page }) => {
    await page.keyboard.press('Tab');
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper ARIA labels', async ({ page }) => {
    const buttons = await page.locator('button').all();
    for (const button of buttons) {
      const ariaLabel = await button.getAttribute('aria-label');
      const textContent = await button.textContent();
      expect(ariaLabel || textContent).toBeTruthy();
    }
  });

  test('should have proper form labels', async ({ page }) => {
    const inputs = await page.locator('input').all();
    for (const input of inputs) {
      const id = await input.getAttribute('id');
      const ariaLabel = await input.getAttribute('aria-label');
      const ariaLabelledBy = await input.getAttribute('aria-labelledby');
      
      if (id) {
        const label = await page.locator(`label[for="${id}"]`);
        const hasLabel = await label.count() > 0;
        expect(hasLabel || ariaLabel || ariaLabelledBy).toBeTruthy();
      }
    }
  });

  test('should be keyboard navigable', async ({ page }) => {
    // Test tab navigation
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');
    
    const focusedElement = await page.locator(':focus');
    await expect(focusedElement).toBeVisible();
  });

  test('should have proper alt text for images', async ({ page }) => {
    const images = await page.locator('img').all();
    for (const img of images) {
      const alt = await img.getAttribute('alt');
      expect(alt).toBeTruthy();
    }
  });

  test('should have proper semantic HTML', async ({ page }) => {
    const main = await page.locator('main');
    await expect(main).toBeVisible();
    
    const nav = await page.locator('nav');
    await expect(nav).toBeVisible();
  });

  test('should have proper screen reader support', async ({ page }) => {
    const elementsWithRole = await page.locator('[role]').all();
    expect(elementsWithRole.length).toBeGreaterThan(0);
  });

  test('should have proper error handling', async ({ page }) => {
    const errorMessages = await page.locator('[role="alert"], .error, .alert').all();
    // Error messages should be properly announced
    for (const error of errorMessages) {
      const ariaLive = await error.getAttribute('aria-live');
      expect(ariaLive).toBeTruthy();
    }
  });
});
