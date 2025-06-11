# Swipe Navigation Utility

This utility provides a reusable swipe navigation system for touch devices across all pages in the application.

## Features

- **Horizontal swipe navigation** between pages (`/spinner`, `/lists`, `/combos`)
- **Preserves vertical scrolling** - does not interfere with normal page scrolling
- **Configurable swipe handlers** for custom behaviors
- **Modal-aware** - automatically disables when modals are open
- **TypeScript support** with proper type definitions

## Basic Usage

### Option 1: Using the SwipeNavigationHandler class

```typescript
import { SwipeNavigationHandler } from '$lib/swipe-navigation';

let swipeHandler: SwipeNavigationHandler;

onMount(() => {
  swipeHandler = new SwipeNavigationHandler({
    currentPage: '/spinner', // or '/lists' or '/combos'
    options: {
      shouldDisableSwipe: () => showModal || isLoading,
      // Custom handlers (optional)
      onSwipeDown: () => {
        // Custom behavior for swipe down
      }
    }
  });

  // Attach to document or specific element
  const cleanup = swipeHandler.attachToElement(document);

  return cleanup; // Cleanup function for onDestroy
});
```

### Option 2: Using the Svelte action (simpler)

```typescript
import { swipeNavigation } from '$lib/swipe-navigation';
```

```html
<div use:swipeNavigation={{ currentPage: '/spinner' }}>
  <!-- Your page content -->
</div>
```

## Default Navigation Behavior

The utility provides automatic page navigation based on horizontal swipes:

| Current Page | Swipe Left → | Swipe Right → |
|--------------|-------------|---------------|
| `/lists`     | `/spinner`  | (no action)   |
| `/spinner`   | `/combos`    | `/lists`      |
| `/combos`     | (no action) | `/spinner`    |

## Configuration Options

### SwipeOptions Interface

```typescript
interface SwipeOptions {
  /** Minimum distance in pixels for a swipe to be recognized (default: 50) */
  minSwipeDistance?: number;

  /** Whether to prevent default browser behavior on swipes (default: true) */
  preventDefault?: boolean;

  /** Function to check if swipe handling should be disabled */
  shouldDisableSwipe?: () => boolean;

  /** Custom swipe handlers for different directions */
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  onSwipeUp?: () => void;
  onSwipeDown?: () => void;
}
```

## Important Notes

### Vertical Scrolling Preservation

The utility is designed to **not interfere** with vertical scrolling:

- Only horizontal swipes trigger navigation
- Vertical touch events are left alone to preserve normal scrolling
- `preventDefault()` is only called on horizontal swipes

### Performance Optimization

- Touch start events use passive listeners for better performance
- Touch move and end events are non-passive only when needed
- Minimal overhead when swipes are disabled

### Modal Awareness

Always disable swipe navigation when modals are open:

```typescript
shouldDisableSwipe: () => showAuthModal || showDeleteModal || isAddingItem
```

## Examples

### Spinner Page (with custom swipe down)

```typescript
swipeHandler = new SwipeNavigationHandler({
  currentPage: '/spinner',
  options: {
    shouldDisableSwipe: () => allRotating || showAuthModal,
    onSwipeDown: () => {
      // Create combo on swipe down
      if (shouldHandleInteraction() && firstRotationComplete) {
        addCombo(null);
      }
    }
  }
});
```

### Lists Page (basic navigation only)

```typescript
swipeHandler = new SwipeNavigationHandler({
  currentPage: '/lists',
  options: {
    shouldDisableSwipe: () => showAuthModal || showDeleteModal || isAddingItem
  }
});
```

### Combo Page (preserve scrolling)

```typescript
swipeHandler = new SwipeNavigationHandler({
  currentPage: '/combos',
  options: {
    shouldDisableSwipe: () => showAuthModal || showDeleteModal
    // No vertical swipe handlers - preserves normal scrolling
  }
});
```

## Migration from Manual Implementation

If you have existing touch handlers, replace them with this utility:

### Before (manual implementation)
```typescript
function handleTouchStart(event: TouchEvent) { /* ... */ }
function handleTouchMove(event: TouchEvent) { /* ... */ }
function handleTouchEnd(event: TouchEvent) { /* ... */ }

// In template
<main ontouchstart={handleTouchStart} ontouchmove={handleTouchMove} ontouchend={handleTouchEnd}>
```

### After (using utility)
```typescript
import { SwipeNavigationHandler } from '$lib/swipe-navigation';

let swipeHandler: SwipeNavigationHandler;

onMount(() => {
  swipeHandler = new SwipeNavigationHandler({
    currentPage: '/your-page',
    options: { /* your options */ }
  });

  return swipeHandler.attachToElement(document);
});

// Template becomes clean
<main>
```

## Browser Support

- **iOS Safari**: Prevents native back gesture conflicts
- **Android Chrome**: Optimized touch handling
- **Desktop**: Gracefully ignores non-touch interactions
