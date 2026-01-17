# Core Analysis Module

## Overview

The `core/analysis` module provides a clean, decoupled service layer for AI-powered image analysis. It separates business logic from HTTP framework concerns.

## Architecture

```
core/analysis/
├── constants.ts         # Centralized constant definitions
├── types.ts             # TypeScript type definitions
├── ImageProcessor.ts    # Image processing utilities (pure functions)
├── AnalysisEngine.ts    # Core analysis engine class
└── index.ts             # Module exports
```

## Key Components

### AnalysisEngine

The main service class that orchestrates image analysis:

```typescript
import { AnalysisEngine } from '@/core/services';

const engine = new AnalysisEngine(aiService);
const result = await engine.analyzeSingleImage({
  image: base64Data,
  options: {
    language: 'zh',
    mode: 'ACADEMIC',
    grade: 10,
    subject: '数学'
  }
});
```

### Image Processing Functions

Pure functions for image data manipulation:

```typescript
import { processImage, validateBase64, getImageSize } from '@/core/services';

const imageData = processImage(rawData);
const isValid = validateBase64(imageData.base64);
const size = getImageSize(imageData.base64);
```

### Constants

Centralized constant definitions to avoid magic values:

```typescript
import { AnalysisMode, Language, DEFAULT_MIME_TYPE } from '@/core/services';

const mode = AnalysisMode.ACADEMIC;
const lang = Language.ZH;
```

## Design Principles

1. **Separation of Concerns**: Business logic is completely decoupled from HTTP framework
2. **Type Safety**: Comprehensive TypeScript interfaces ensure compile-time safety
3. **Pure Functions**: Image processing uses pure functions for better testability
4. **Dependency Injection**: AnalysisEngine accepts AIService via constructor
5. **Backward Compatibility**: Legacy API formats are supported with automatic conversion

## Migration Guide

### Old API (deprecated)
```typescript
const result = await aiService.analyzeImage(
  imageBase64,
  mimeType,
  language,
  userGrade,
  subjectName,
  mode
);
```

### New API (recommended)
```typescript
const engine = new AnalysisEngine(aiService);
const result = await engine.analyzeSingleImage({
  image: imageBase64,
  options: {
    mimeType,
    language,
    grade: userGrade,
    subject: subjectName,
    mode
  }
});
```

## Testing

The pure function design makes unit testing straightforward:

```typescript
import { processImage, validateBase64 } from '@/core/services';

test('should parse data URL correctly', () => {
  const result = processImage('data:image/jpeg;base64,ABC123');
  expect(result.mimeType).toBe('image/jpeg');
  expect(result.base64).toBe('ABC123');
});
```
