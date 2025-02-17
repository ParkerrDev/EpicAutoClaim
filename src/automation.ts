import { Page } from 'playwright';

async function randomDelay(min: number, max: number) {
    console.log(`Delaying randomly between ${min}ms and ${max}ms`);
    await new Promise(resolve => setTimeout(resolve, Math.random() * (max - min) + min));
    console.log(`Delay completed`);
}

export async function automateEpicGamesOrder(page: Page) {
    console.log("Starting automateEpicGamesOrder");
    console.log("Navigating to Epic Games store...");
    try {
        await page.goto('https://store.epicgames.com/en-US/', {
            waitUntil: 'domcontentloaded',
            timeout: 15000 // reduced timeout
        });
        console.log("Navigation complete.");
        await randomDelay(500, 1000); // reduced delay

        // Debug: Print all data-component attributes on the page
        const components = await page.evaluate(() => {
            const elements = document.querySelectorAll('[data-component]');
            return Array.from(elements).map(el => {
                return {
                    component: el.getAttribute('data-component'),
                    className: el.className
                };
            });
        });
        console.log("Available components:", components);

        // Look for the free games section using multiple possible selectors
        console.log("Looking for free games container...");
        let containerFound = false;
        try {
            // Try multiple selectors
            const containerSelectors = [
                'section[data-component="FreeGames"]',
                'div[data-testid="freegames-section"]',
                'section:has-text("Free Games")',
                'div:has-text("Free Now")'
            ];

            for (const selector of containerSelectors) {
                console.log(`Trying selector: ${selector}`);
                try {
                    const element = await page.waitForSelector(selector, {
                        timeout: 3000,
                        state: 'attached'
                    });
                    if (element) {
                        console.log(`Found container with selector: ${selector}`);
                        containerFound = true;
                        break;
                    }
                } catch (e) {
                    console.log(`Selector ${selector} not found`);
                }
            }

            if (!containerFound) {
                // If still not found, let's get the page content for debugging
                const pageContent = await page.content();
                console.log("Page HTML:", pageContent.substring(0, 1000) + "..."); // First 1000 chars
                throw new Error("No free games container found with any selector");
            }
        } catch (error) {
            console.error('Free games container not found:', error);
            return;
        }

        await randomDelay(300, 700); // reduced delay after container check

        // Get all free game offers and convert relative URLs to absolute URLs
        console.log("Extracting free game links...");
        const freeNowLinks = await page.evaluate(() => {
            const links: string[] = [];
            const offerCards = document.querySelectorAll('div.css-cdosd6 div.css-aere9z a.css-g3jcms');
            console.log(`Found ${offerCards.length} offer cards`);

            offerCards.forEach(card => {
                if (card instanceof HTMLAnchorElement) {
                    const freeNowLabel = card.querySelector('div.css-82y1uz span');
                    if (freeNowLabel && freeNowLabel.textContent?.trim() === 'Free Now') {
                        let href = card.getAttribute('href') || '';
                        // Convert relative URL to absolute URL if needed
                        if (href.startsWith('/')) {
                            href = 'https://store.epicgames.com' + href;
                        }
                        console.log(`Found Free Now game: ${href}`);
                        links.push(href);
                    } else {
                        console.log(`Skipping: Not Free Now - ${card.href}`);
                    }
                }
            });
            return links;
        });

        console.log(`Found ${freeNowLinks.length} Free Now links:`, freeNowLinks);

        // Process each free game
        for (const link of freeNowLinks) {
            console.log(`Processing game at ${link}`);
            try {
                // Use faster navigation options: lower timeout and shorter waitUntil condition
                await page.goto(link, { timeout: 15000, waitUntil: 'domcontentloaded' });
                await randomDelay(300, 700); // reduced delay
                
                // Check and click the continue button if an age warning appears
                try {
                    console.log("Checking for age verification dialog...");
                    // Wait longer for the dialog and use multiple selectors
                    const continueButtonSelectors = [
                        '#btn_age_continue',
                        'button:has-text("Continue")',
                        '[data-testid="age-gate-continue-button"]'
                    ];

                    for (const selector of continueButtonSelectors) {
                        try {
                            const continueButton = await page.waitForSelector(selector, {
                                timeout: 5000,
                                state: 'visible'
                            });

                            if (continueButton) {
                                console.log(`Found continue button with selector: ${selector}`);
                                await randomDelay(300, 500);
                                await continueButton.click();
                                console.log("Clicked continue button");
                                await page.waitForLoadState('domcontentloaded');
                                await randomDelay(500, 1000);
                                break;
                            }
                        } catch (e) {
                            console.log(`Continue button not found with selector: ${selector}`);
                        }
                    }
                } catch (err) {
                    console.log("No age verification dialog detected");
                }
                await randomDelay(300, 700); // reduced delay

                try {
                    console.log("Looking for purchase button...");
                    const button = await page.waitForSelector('button:has-text("Get")', {
                        timeout: 20000, // reduced timeout
                        state: 'visible'
                    });

                    if (!button) {
                        console.log('Purchase button not found, skipping...');
                        continue;
                    }

                    const buttonText = await button.textContent();
                    console.log(`Found button with text: ${buttonText}`);

                    const isDisabled = await button.isDisabled();
                    if (isDisabled) {
                        console.log('Button is disabled, skipping...');
                        continue;
                    }

                    if (buttonText?.includes('Requires Base Game') || buttonText?.includes('Already Claimed')) {
                        console.log(`Skipping: ${buttonText}`);
                        continue;
                    }

                    console.log("Clicking purchase button...");
                    await button.click();
                    await randomDelay(300, 700); // reduced delay after clicking purchase
                    // Wait for the iframe containing the "Place Order" button
                    try {
                        console.log('Waiting for iframe with "Place Order" button...');
                        const iframeHandle = await page.waitForSelector('#webPurchaseContainer iframe', { timeout: 15000 });
                        console.log('Found iframe, getting frame context...');
                        const frame = await iframeHandle.contentFrame();
                        
                        if (frame) {
                            console.log('Successfully switched to iframe context');
                            
                            try {
                                // Wait for the payment container and button to be ready
                                console.log('Waiting for payment elements to load...');
                                await frame.waitForLoadState('domcontentloaded');
                                await randomDelay(1000, 2000);

                                // Try direct click on the button
                                const placeOrderButton = await frame.waitForSelector('.payment-btn.payment-order-confirm__btn.payment-btn--primary', {
                                    state: 'visible',
                                    timeout: 10000
                                });

                                if (placeOrderButton) {
                                    console.log('Found Place Order button, waiting for stability...');
                                    
                                    // Wait for button to be stable
                                    await placeOrderButton.waitForElementState('stable');
                                    
                                    // Additional 2 second wait to ensure button is fully ready
                                    console.log('Waiting additional 2 seconds for button stability...');
                                    await page.waitForTimeout(2000);
                                    
                                    // Verify button is still present and visible after wait
                                    const buttonStillPresent = await frame.waitForSelector('.payment-btn.payment-order-confirm__btn.payment-btn--primary', {
                                        state: 'visible',
                                        timeout: 5000
                                    }).catch(() => null);

                                    if (buttonStillPresent) {
                                        console.log('Button remained stable, clicking...');
                                        await buttonStillPresent.click({
                                            force: true,
                                            timeout: 5000
                                        });
                                        
                                        console.log('Place Order button clicked successfully');
                                        await randomDelay(1000, 2000);
                                        
                                        // Wait for any loading state to complete
                                        await frame.waitForLoadState('networkidle');
                                        
                                        console.log('Waiting for captcha if needed...');
                                        await page.waitForTimeout(30000);
                                    } else {
                                        console.log('Place Order button not found in iframe');
                                    }
                                } else {
                                    console.log('Place Order button not found in iframe');
                                }
                            } catch (buttonError) {
                                console.error('Error with Place Order button:', buttonError);
                                
                                // Debug: Print iframe content
                                const content = await frame.content();
                                console.log('Iframe content:', content);
                            }
                        } else {
                            console.error('Could not access iframe content');
                            // Debug iframe content
                            const frames = page.frames();
                            console.log(`Total frames found: ${frames.length}`);
                            for (const f of frames) {
                                console.log(`Frame URL: ${f.url()}`);
                            }
                        }
                    } catch (paymentError) {
                        console.error('Error with Place Order process:', paymentError);
                    }
                } catch (error) {
                    console.error(`Error processing ${link}:`, error);
                    continue;
                }
            } catch (error) {
                console.error(`Error navigating to ${link}:`, error);
                continue;
            }
        }
        console.log("Finished processing all free games");
    } catch (error) {
        console.error("General error in automateEpicGamesOrder:", error);
    }
}

export async function automateFabOrder(page: Page) {
    console.log("Starting automateFabOrder for Fab website.");
    try {
        await page.goto('https://www.fab.com', { timeout: 60000, waitUntil: 'networkidle' });
        console.log("Navigated to Fab website.");

        // Find links from items in "fabkit-ResultGrid-root fabkit-ResultGrid-col--sm fabkit-Grid-root"
        try {
            const items = await page.$$('.fabkit-ResultGrid-root .fabkit-ResultGrid-col--sm .fabkit-Grid-root a');
            console.log(`Found ${items.length} items on Fab website.`);

            for (const item of items) {
                try {
                    console.log("Clicking an item link to initiate order...");
                    await item.click({ timeout: 20000 });

                    // Add additional steps for order placement as needed
                    // Example: Add to cart, proceed to checkout, etc.
                    console.log("Clicked item.  Waiting for navigation.");
                    await page.waitForNavigation({ waitUntil: 'networkidle', timeout: 30000 });
                    console.log("Navigated to item details page.");

                    // Placeholder for further actions - replace with actual steps
                    console.log("Further order placement steps would be added here.");
                    break; // Exit after clicking the first item
                } catch (itemError) {
                    console.error("Error processing an item:", itemError);
                    continue;
                }
            }
            console.log("Finished order initiation on Fab website.");
        } catch (itemsError) {
            console.error("Error finding items on Fab website:", itemsError);
        }
    } catch (navigationError) {
        console.error("Error navigating to Fab website:", navigationError);
    }
}