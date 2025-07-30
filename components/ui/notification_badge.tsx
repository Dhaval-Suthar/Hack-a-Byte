
import React from "react";
import Image from "next/image";

interface NotificationBadgeProps {
  count?: number;
  show?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const NotificationBadge: React.FC<NotificationBadgeProps> = ({
  show = true,
  className = "",
  style = {},
}) => {
  if (!show) return null;
  return (
    <span
      className={`absolute -top-1.5 -right-3 flex items-center justify-center ${className}`}
      style={{ zIndex: 2, width: 48, height: 48, ...style }}
      aria-label="Windows 95 Alert"
    >
      <style>{`
        @keyframes blink-w95-badge {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
      `}</style>
      <Image
        src="/hackbook-W95/window_95Alert.png"
        alt="Windows 95 Alert"
        width={48}
        height={48}
        style={{ imageRendering: 'pixelated', animation: 'blink-w95-badge 1s steps(1, end) infinite', display: 'block' }}
        draggable={false}
        unoptimized
        priority
      />
    </span>
  );
};

export default NotificationBadge;