This project is designed to automate the process of claiming free games from Epic Games and placing orders on the Fab website using Playwright.

## Project Structure

- **src/**: Contains the source code for navigation and automation.
  - **navigation.ts**: Functions for navigating to the Epic Games and Fab websites.
  - **automation.ts**: Functions to automate the order placement process.
  
- **tests/**: Contains test cases for the automation functionalities.
  - **epicGames.test.ts**: Test cases for Epic Games automation.
  - **fab.test.ts**: Test cases for Fab automation.

- **playwright.config.ts**: Configuration file for Playwright.

- **package.json**: npm configuration file listing dependencies and scripts.

- **tsconfig.json**: TypeScript configuration file.

## Setup Instructions

1. Clone the repository:
   ```
   git clone <repository-url>
   ```

2. Navigate to the project directory:
   ```
   cd my-playwright-project
   ```

3. Install the dependencies:
   ```
   npm install
   ```

4. Run the tests:
   ```
   npx playwright test
   ```

## Usage

- The project includes functions to navigate to the Epic Games free games page and the Fab website.
- It automates the order placement process for items found on these platforms.

## Running Tests

Use the Playwright CLI or the npm script:
```
npm run test
```
or
```
npx playwright test
```

## Contributing

Feel free to submit issues or pull requests for improvements or bug fixes.