import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('should load the application', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/MorphoScan Pro/)
  })

  test('should show login form', async ({ page }) => {
    await page.goto('/auth')
    await expect(page.locator('input[type="email"]')).toBeVisible()
    await expect(page.locator('input[type="password"]')).toBeVisible()
  })

  test('should navigate to privacy policy', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.locator('text=Privacy Policy')).toBeVisible()
  })

  test('should navigate to terms of service', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.locator('text=Terms of Service')).toBeVisible()
  })
})
