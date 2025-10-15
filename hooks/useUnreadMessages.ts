// This file is no longer needed - notification logic moved to useNotificationService.ts
// Kept for backwards compatibility but does nothing
export function useUnreadMessages(_teamId: string | undefined) {
  return { email: 0, sms: 0 };
}
