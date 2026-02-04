# Playwright Tests

This directory contains end-to-end tests for the Heegelmotiivid Pro application using Playwright and TypeScript.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Install Playwright browsers:
```bash
npx playwright install
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests in UI mode
```bash
npm run test:ui
```

### Run tests in headed mode (see browser)
```bash
npm run test:headed
```

### Run tests in debug mode
```bash
npm run test:debug
```

### Run specific test file
```bash
npx playwright test tests/canvas.spec.ts
```

## Test Structure

- `canvas.spec.ts` - Canvas rendering and drawing tests
- `tools.spec.ts` - Tool functionality tests (draw, erase, line, move, select)
- `stitches.spec.ts` - Stitch selection and palette tests
- `layers.spec.ts` - Layer/round management tests
- `zoom.spec.ts` - Zoom and pan functionality tests
- `custom-stitches.spec.ts` - Custom stitch creation tests
- `export-import.spec.ts` - Export/import functionality tests
- `mobile.spec.ts` - Mobile responsive design tests
- `ui.spec.ts` - UI component tests

## Helpers

The `helpers/page-helpers.ts` file contains reusable helper functions for interacting with the application.

## Configuration

Test configuration is in `playwright.config.ts`. The tests run against `http://localhost:8000` by default.

## CI/CD

Tests are configured to run in CI environments with retries and proper reporting.

