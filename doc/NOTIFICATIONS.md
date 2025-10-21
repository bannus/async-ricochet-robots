# Toast Notification System

## Overview

The application uses a toast notification system to display user feedback messages instead of browser alert dialogs. This provides a better user experience with non-blocking, styled notifications.

## Implementation

### Core Module
- **File**: `client/src/notifications.ts`
- **Functions**:
  - `showNotification(message, type?, duration?)` - Base notification function
  - `showSuccess(message, duration?)` - Success messages (green)
  - `showError(message, duration?)` - Error messages (red)
  - `showWarning(message, duration?)` - Warning messages (yellow)
  - `showInfo(message, duration?)` - Info messages (blue)

### CSS Styling
- **File**: `client/css/game.css`
- Toast notifications appear at the top-center of the screen
- Animate in from top with fade effect
- Four color variants for different message types
- Auto-dismiss after configurable duration (default: 3 seconds)

## Usage Examples

```typescript
// Import the notification functions
import { showSuccess, showError, showWarning, showInfo } from './notifications.js';

// Success notification (green, 3s default)
showSuccess('Round published successfully!');

// Error notification (red, 3s default)
showError('Failed to submit solution');

// Warning notification (yellow, 3s default)
showWarning('Please enter your name');

// Info notification (blue, 5s duration)
showInfo('New round started!', 5000);

// Custom duration (in milliseconds)
showSuccess('Solution submitted! You can submit again.', 5000);
```

## Migration from alert()

All browser `alert()` dialogs have been replaced with toast notifications:

### Files Updated
1. **client/src/player-app.ts** (5 alerts → toasts)
   - Form validation warnings
   - Solution submission success/errors
   - Replay errors

2. **client/src/create-game.ts** (3 alerts → toasts)
   - Game creation errors
   - Form validation
   - Clipboard copy errors

3. **client/src/host-manager.ts** (28 alerts → toasts)
   - Goal preview/skip/publish feedback
   - Round management (complete/extend)
   - Validation errors
   - Success confirmations

### Total: 36 alert dialogs replaced

## Design Decisions

### Why Toast Notifications?
1. **Non-blocking**: Users can continue interacting with the page
2. **Better UX**: More modern, polished appearance
3. **Contextual**: Color-coded by message type
4. **Consistent**: Same styling across all notifications
5. **Accessible**: Still readable and visible

### Type Selection Guidelines
- **Success** (green): Successful operations, confirmations
- **Error** (red): Failed operations, API errors, critical issues
- **Warning** (yellow): Validation errors, missing input, non-critical issues
- **Info** (blue): General information, status updates, neutral messages

### Duration Guidelines
- **3 seconds** (default): Short messages, simple confirmations
- **4-5 seconds**: Longer messages with multiple pieces of information
- Messages auto-dismiss, but users can read at their own pace

## Confirm Dialogs

Note: `confirm()` dialogs are still used for destructive actions that require explicit user confirmation:
- Publishing rounds
- Completing rounds
- Skipping goals
- Changing deadlines

These remain as blocking dialogs because they:
1. Prevent accidental destructive actions
2. Require explicit yes/no user decision
3. Match user expectations for critical operations

## Future Enhancements

Potential improvements for future consideration:
- Action buttons within notifications
- Progress indicators for long operations
- Notification queue/stacking for multiple simultaneous messages
- Dismiss on click
- Notification history/log
- Custom icons per message type
