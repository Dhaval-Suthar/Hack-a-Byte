/**
 * Role Access Notification System
 * Provides consistent feedback when users try to access restricted apps
 */

export interface RoleAccessNotification {
  show: (appId: string, userRole: string, teamSize: number) => void;
}

// Create a simple notification system for role access violations
export const createRoleAccessNotification = (): RoleAccessNotification => {
  return {
    show: (appId: string, userRole: string, teamSize: number) => {
      // Create and show a temporary notification
      const notification = document.createElement('div');
      notification.className = 'fixed top-4 right-4 bg-red-600 text-white px-4 py-3 rounded-lg shadow-lg z-50 max-w-sm';
      notification.innerHTML = `
        <div class="flex items-start">
          <div class="flex-shrink-0 mr-3">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"></path>
            </svg>
          </div>
          <div>
            <p class="font-semibold text-sm">Access Denied</p>
            <p class="text-xs mt-1">
              ${appId} is restricted for role "${userRole}" in team size ${teamSize}
            </p>
          </div>
        </div>
      `;

      document.body.appendChild(notification);

      // Add entrance animation
      requestAnimationFrame(() => {
        notification.style.transform = 'translateX(0)';
        notification.style.opacity = '1';
      });

      // Remove after 4 seconds
      setTimeout(() => {
        notification.style.transform = 'translateX(100%)';
        notification.style.opacity = '0';
        setTimeout(() => {
          if (notification.parentNode) {
            notification.parentNode.removeChild(notification);
          }
        }, 300);
      }, 4000);
    }
  };
};

// Singleton instance
let notificationSystem: RoleAccessNotification | null = null;

export const getRoleAccessNotification = (): RoleAccessNotification => {
  if (!notificationSystem) {
    notificationSystem = createRoleAccessNotification();
  }
  return notificationSystem;
};