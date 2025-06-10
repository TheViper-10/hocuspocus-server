# Contracts Layer

This directory contains the **contracts layer** for external dependencies, providing an abstraction between our application code and third-party SDKs.

## Purpose

The contracts layer serves as a **facade** that:

1. **Decouples** our application from specific SDK versions
2. **Centralizes** all external dependency imports in one place
3. **Enables** easy swapping between different SDK versions (internal ↔ public)
4. **Controls** which parts of external APIs are exposed to our application
5. **Provides** a place to add custom types or wrapper logic

## Structure

```
src/contracts/
├── index.ts          # Main contracts export file
└── README.md         # This documentation
```

## Usage

### ✅ Good: Import from contracts

```typescript
import { client, AuthTokenRequestedTokenType } from '../contracts';
```

### ❌ Bad: Direct SDK imports

```typescript
import { client } from '@devrev/typescript-sdk-internal';
import { AuthTokenRequestedTokenType } from '@devrev/typescript-sdk-internal/dist/auto-generated/internal/private-internal-devrev-sdk';
```

## Benefits

### Easy SDK Swapping

When DevRev releases a public SDK, we can update just the contracts layer:

```typescript
// Before: Internal SDK
export { client } from '@devrev/typescript-sdk-internal';

// After: Public SDK
export { client } from '@devrev/typescript-sdk';
```

All application code continues to work without changes.

### Version Management

Updating SDK versions only requires changes in one file:

```typescript
// Update from internal v1.2.558 to v1.3.0
export { client } from '@devrev/typescript-sdk-internal'; // Updated in package.json
```

### API Control

We can selectively expose only the parts of the SDK we actually use:

```typescript
// Only export what we need
export {
  AuthTokenRequestedTokenType,
  ArtifactConfigurationSet,
  StagedContentStatus,
  // Not exporting unused types
} from '@devrev/typescript-sdk-internal/dist/auto-generated/internal/private-internal-devrev-sdk';
```

### Custom Extensions

Add application-specific types or wrapper functions:

```typescript
// Custom configuration interface
export interface DevRevConfig {
  endpoint: string;
  timeout?: number;
  retries?: number;
}

// Wrapper function with application-specific logic
export function createDevRevClient(config: DevRevConfig) {
  return client.setupInternal({
    endpoint: config.endpoint,
    // Add application-specific defaults
  });
}
```

## Migration Path

If the SDK changes significantly, we can implement adapters in the contracts layer:

```typescript
// Adapter for breaking changes
export const legacyClient = {
  authTokensCreate: (params: LegacyParams) => {
    // Transform legacy params to new SDK format
    return client.authTokensCreate(transformParams(params));
  },
};
```

This pattern ensures our application code remains stable even when external dependencies change.
