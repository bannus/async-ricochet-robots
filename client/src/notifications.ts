/**
 * Toast Notification System
 * Provides non-blocking toast notifications to replace alert() dialogs
 */

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

/**
 * Show a toast notification
 * @param message - The message to display
 * @param type - Type of notification (success, error, warning, info)
 * @param duration - How long to show the toast in milliseconds (default: 3000)
 */
export function showNotification(
  message: string,
  type: NotificationType = 'info',
  duration: number = 3000
): void {
  const toast = document.createElement('div');
  toast.className = `toast-notification toast-${type}`;
  toast.textContent = message;
  document.body.appendChild(toast);

  // Auto-dismiss after duration
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

/**
 * Show a success notification (green)
 */
export function showSuccess(message: string, duration: number = 3000): void {
  showNotification(message, 'success', duration);
}

/**
 * Show an error notification (red, longer duration)
 */
export function showError(message: string, duration: number = 5000): void {
  showNotification(message, 'error', duration);
}

/**
 * Show a warning notification (yellow)
 */
export function showWarning(message: string, duration: number = 4000): void {
  showNotification(message, 'warning', duration);
}

/**
 * Show an info notification (blue)
 */
export function showInfo(message: string, duration: number = 3000): void {
  showNotification(message, 'info', duration);
}
