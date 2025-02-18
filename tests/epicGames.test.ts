import { test, expect } from '@playwright/test';
import { automateEpicGamesOrder } from '../src/automation.js';
import { setCookiesForPage } from '../src/auth.js';

test.use({
    headless: false // This will show the browser window
});

test('Epic Games Order Placement', async ({ page }) => {
    console.log("Starting Epic Games Order Placement test");
    try {
        // Set cookies for authentication
        await setCookiesForPage(page);
        console.log("Cookies set successfully.");

        // Automate the order placement process
        await automateEpicGamesOrder(page);
        console.log("Order placement automated.");

        // Add assertions to verify the order was placed successfully
        // This could include checking for a confirmation message or similar
        console.log("Checking for confirmation message...");
        // const confirmationMessage = await page.locator('selector-for-confirmation-message');
        // await expect(confirmationMessage).toBeVisible({ timeout: 10000 });
        console.log("Confirmation message check completed (placeholder).");
    } catch (error) {
        console.error("Test failed:", error);
        throw error; // Re-throw the error to mark the test as failed
    }
    console.log("Epic Games Order Placement test finished.");
});