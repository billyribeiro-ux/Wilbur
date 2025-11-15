# Testing Guide

## Overview

This project uses a comprehensive testing strategy with three layers:
1. **Unit Tests** (Vitest) - Fast, isolated tests for utilities and services
2. **Component Tests** (React Testing Library + Vitest) - Integration tests for React components
3. **E2E Tests** (Playwright) - End-to-end smoke tests for critical user flows

---

## Running Tests Locally

### Unit Tests
```bash
# Run all unit tests
npm run test:unit

# Run in watch mode
npm test

# Run with coverage
npm run test:coverage

# Run specific test file
npx vitest tests/unit/fileValidation.test.ts
```

### Component Tests
```bash
# Component tests are included in unit test suite
npm run test:unit

# Run specific component test
npx vitest src/components/theme/__tests__/AdvancedBrandingSettings.test.tsx
```

### E2E Tests
```bash
# Start dev server first
npm run dev

# In another terminal, run E2E tests
npm run test:e2e

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in UI mode (interactive)
npm run test:e2e:ui

# Run specific test file
npx playwright test tests/e2e/branding-smoke.spec.ts
```

---

## Test Structure

### Unit Tests (`tests/unit/`)
- `fileValidation.test.ts` - File validation logic (8 tests)
- `storageService.test.ts` - Supabase storage uploads (5 tests)
- `cssVarManager.test.ts` - CSS variable management with SSR guards (6 tests)
- `themeExport.test.ts` - Theme export/import (8 tests)
- `rateLimit.test.ts` - Rate limiting (9 tests)

### Component Tests (`src/components/**/__tests__/`)
- `AdvancedBrandingSettings.test.tsx` - Main branding modal (13 tests)

### E2E Tests (`tests/e2e/`)
- `branding-smoke.spec.ts` - Critical user flows (6 scenarios)

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Tests

on: [push, pull_request]

jobs:
  unit-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npm run test:unit

  e2e-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run build
      - run: npm run preview &
      - run: npx wait-on http://localhost:4173
      - run: npm run test:e2e
```

---

## Test Coverage

### Current Coverage
- **Utilities:** 100% (all functions tested)
- **Services:** 100% (all functions tested)
- **Components:** ~80% (critical paths covered)
- **E2E:** Smoke tests for critical flows

### Coverage Goals
- Maintain 100% coverage for utilities and services
- Maintain 80%+ coverage for components
- Add E2E tests for new critical user flows

---

## Writing New Tests

### Unit Test Template
```typescript
import { describe, it, expect } from 'vitest';
import { myFunction } from '../myModule';

describe('myModule', () => {
  describe('myFunction', () => {
    it('should handle valid input', () => {
      // Arrange
      const input = 'test';
      
      // Act
      const result = myFunction(input);
      
      // Assert
      expect(result).toBe('expected');
    });

    it('should handle invalid input', () => {
      const input = null;
      
      expect(() => myFunction(input)).toThrow('Invalid input');
    });
  });
});
```

### Component Test Template
```typescript
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MyComponent } from '../MyComponent';

describe('MyComponent', () => {
  it('should render with props', () => {
    render(<MyComponent title="Test" />);
    
    expect(screen.getByText('Test')).toBeInTheDocument();
  });

  it('should handle user interaction', () => {
    const onClickMock = vi.fn();
    render(<MyComponent onClick={onClickMock} />);
    
    fireEvent.click(screen.getByRole('button'));
    
    expect(onClickMock).toHaveBeenCalled();
  });
});
```

### E2E Test Template
```typescript
import { test, expect } from '@playwright/test';

test.describe('Feature Name', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5173');
  });

  test('should complete user flow', async ({ page }) => {
    // Navigate
    await page.click('button:has-text("Start")');
    
    // Interact
    await page.fill('input[name="email"]', 'test@example.com');
    await page.click('button:has-text("Submit")');
    
    // Assert
    await expect(page.locator('text=Success')).toBeVisible();
  });
});
```

---

## Mocking Guidelines

### Mock Supabase
```typescript
const mockSupabase = {
  from: vi.fn(() => ({
    select: vi.fn(() => ({
      eq: vi.fn(() => ({
        single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      })),
    })),
  })),
};
```

### Mock Zustand Store
```typescript
vi.mock('../store/myStore', () => ({
  useMyStore: () => ({
    value: 'test',
    setValue: vi.fn(),
  }),
}));
```

### Mock Toast
```typescript
const mockAddToast = vi.fn();
vi.mock('../store/toastStore', () => ({
  useToastStore: () => ({
    addToast: mockAddToast,
  }),
}));

// Assert
expect(mockAddToast).toHaveBeenCalledWith('Success message', 'success');
```

---

## Debugging Tests

### Vitest
```bash
# Run with verbose output
npx vitest --reporter=verbose

# Run single test with debugging
npx vitest --no-coverage --reporter=verbose tests/unit/myTest.test.ts

# Use console.log in tests (will show in output)
```

### Playwright
```bash
# Run in debug mode
npx playwright test --debug

# Run with trace
npx playwright test --trace on

# View trace
npx playwright show-trace trace.zip
```

---

## Best Practices

### DO
- ✅ Use AAA pattern (Arrange, Act, Assert)
- ✅ Mock external dependencies (Supabase, network calls)
- ✅ Test error paths, not just happy paths
- ✅ Use descriptive test names
- ✅ Keep tests fast and isolated
- ✅ Clean up after tests (reset mocks, clear state)

### DON'T
- ❌ Test implementation details
- ❌ Make tests dependent on each other
- ❌ Use real credentials or network calls
- ❌ Test third-party libraries
- ❌ Write tests that are flaky
- ❌ Ignore failing tests

---

## Troubleshooting

### "Module not found" errors
```bash
# Clear Vitest cache
npx vitest --clearCache

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install
```

### "Test timeout" errors
```typescript
// Increase timeout for slow tests
it('slow test', async () => {
  // ...
}, 10000); // 10 second timeout
```

### Playwright browser issues
```bash
# Reinstall browsers
npx playwright install --with-deps
```

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [React Testing Library](https://testing-library.com/react)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)
