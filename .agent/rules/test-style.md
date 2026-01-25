

# Test Writing Guidelines

## Core Philosophy

**Write tests that verify what SHOULD happen, not what DOES happen.**

Tests should be derived from **requirements and specifications**, not from examining the current implementation. A test that only passes because you looked at the code is not a useful test.

## The Critical Question

Before writing any test, ask yourself:

> "Am I writing this test so that it will make the implementation pass, or am I writing it to verify the implementation is correct?"

If you're doing the former, **stop and reconsider**.

## Requirement-Driven vs Implementation-Driven

### ❌ Implementation-Driven (WRONG)
1. Look at the code
2. See that it uses `>=` for threshold
3. Write test that expects `>=` behavior
4. Test passes, but doesn't catch bugs

### ✅ Requirement-Driven (CORRECT)
1. Read the specification/requirements
2. Understand what the behavior SHOULD be
3. Write test based on that understanding
4. If test fails, investigate WHY — the implementation might be wrong

## Best Practices

### 1. Document Specifications in Tests
```typescript
describe("SPEC: Session Calculation", () => {
  /**
   * REQUIREMENT: "If no activity for 15 minutes, the session is considered ended"
   */
  it("gap of exactly 15 minutes should still be same session (not > 15 min)", ...);
});
```

### 2. Test Boundary Conditions Explicitly
```typescript
// Test the exact threshold value
it("duration of 119 seconds (just under threshold) SHOULD count", ...);
it("duration of 120 seconds (exactly at threshold) should NOT count", ...);
it("duration of 121 seconds (above threshold) should NOT count", ...);
```

### 3. Test Names Should Describe Expected Behavior
```typescript
// ✅ Good - describes what SHOULD happen
it("gap of 15 min + 1ms should create a new session", ...);

// ❌ Bad - describes implementation detail
it("sessions increments when timestamp diff exceeds SESSION_GAP_MS", ...);
```

### 4. When Tests Fail, Don't Automatically Fix the Test

If a test fails:
1. **First**, examine the implementation to understand WHY
2. **Ask**: Is the spec wrong, or is the implementation wrong?
3. **Only** fix the test if the test logic itself is flawed (e.g., bad setup)
4. **Fix the implementation** if it doesn't match the spec

### 5. Verify Test Setup Math

A test can be "requirement-driven" but still have logic errors:
```typescript
// ❌ Logic error in test setup
for (let i = 0; i < 10; i++) { // Creates heartbeats at 0,1,2...9 = 9 min span!
  heartbeats.push(createHeartbeat(new Date(base + i * 60000)));
}

// ✅ Correct math
for (let i = 0; i <= 10; i++) { // Creates heartbeats at 0,1,2...10 = 10 min span
  heartbeats.push(createHeartbeat(new Date(base + i * 60000)));
}
```

### 6. Use Constants, Not Magic Numbers
```typescript
// ✅ Clear what we're testing against
const gap = SESSION_GAP_MS + 1;

// ❌ Magic number with no context
const gap = 900001;
```

## Test File Structure

```typescript
/**
 * [Feature] Tests
 *
 * These tests are REQUIREMENT-DRIVEN, not implementation-driven.
 * Each test verifies expected behavior based on documented specifications.
 */

// Document spec constants
describe("SPEC: Threshold Constants", () => { ... });

// Group by feature area
describe("SPEC: Feature Name", () => {
  describe("should [expected behavior]", () => {
    it("[specific scenario]", () => { ... });
  });

  describe("edge cases", () => {
    it("[edge case scenario]", () => { ... });
  });
});
```

## Questions to Ask Before Writing Tests

1. What is the **documented requirement** for this behavior?
2. What should happen at the **exact threshold** values?
3. What are the **edge cases** (empty input, negative values, etc.)?
4. If this test fails, would it reveal a **real bug** in the implementation?
5. Can someone reading this test understand the **expected behavior** without looking at the implementation?

## Running Tests

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run specific test file
pnpm test src/__tests__/metrics.test.ts
```
