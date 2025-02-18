import { Page } from 'playwright';
import fs from 'fs/promises';

export async function setCookiesForPage(page: Page) {
    try {
        const cookiesStr = await fs.readFile('cookie.json', 'utf-8');
        let cookies = JSON.parse(cookiesStr);

        cookies = cookies.map((cookie: any) => {
            return {
                name: cookie.name,
                value: cookie.value,
                domain: cookie.domain?.replace(/^\./, ''),
                path: '/',
                secure: cookie.secure === true,
                sameSite: 'Lax',
                ...(cookie.httpOnly && { httpOnly: true }),
                ...(cookie.expirationDate && { expires: cookie.expirationDate }),
            };
        }).filter((cookie: { name: any; value: any; domain: any; }) => cookie.name && cookie.value && cookie.domain);

        console.log("Adding cookies to page:", cookies);
        await page.context().addCookies(cookies);
        console.log("Cookies added successfully.");
    } catch (error) {
        console.error("Error setting cookies:", error);
    }
}
