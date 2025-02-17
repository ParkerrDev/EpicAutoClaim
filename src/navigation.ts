import { Page } from 'playwright';

export async function navigateToEpicGames(page: Page) {
    await page.goto('https://www.epicgames.com/store/en-US/free-games');
}

export async function navigateToFab(page: Page) {
    await page.goto('https://www.fab.com');
}

// New function to navigate through a list of pages
export async function navigateThroughPages(page: Page) {
    const links = [
        'https://www.epicgames.com/store/en-US/free-games',
        'https://www.fab.com'
    ];
    for (const link of links) {
        await page.goto(link);
        // Optionally wait for page load or perform actions between navigations
    }
}