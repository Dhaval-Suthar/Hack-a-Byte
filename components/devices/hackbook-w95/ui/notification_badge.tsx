import React from 'react';

interface NotificationBadgeProps {
  count?: number;
}

export default function NotificationBadge({ count }: NotificationBadgeProps) {
  if (!count || count <= 0) return null;

  return (
    <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
      {count > 99 ? '99+' : count}
    </div>
  );
}
