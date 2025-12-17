import React from 'react';

/**
 * Notification Item Component
 * Displays notification messages with actions
 * Based on the notifications list from the design
 */

export interface NotificationItemProps {
  id: string;
  avatar: string;
  company: string;
  message: string;
  description: string;
  timestamp: string;
  status?: 'warning' | 'success' | 'error' | 'info';
  onAccept?: (id: string) => void;
  onDecline?: (id: string) => void;
  showActions?: boolean;
}

export function NotificationItem({
  id,
  avatar,
  company,
  message,
  description,
  timestamp,
  status = 'info',
  onAccept,
  onDecline,
  showActions = true,
}: NotificationItemProps) {
  const statusColors = {
    warning: 'bg-[#FEF3C7]',
    success: 'bg-[#D1FAE5]',
    error: 'bg-[#FEE2E2]',
    info: 'bg-[#DBEAFE]',
  };

  const statusDotColors = {
    warning: 'bg-[#F59E0B]',
    success: 'bg-[#10B981]',
    error: 'bg-[#EF4444]',
    info: 'bg-[#3B82F6]',
  };

  return (
    <div className="flex gap-4 p-4 border-b border-neutral-200 hover:bg-neutral-50 transition-colors duration-200 cursor-pointer">
      {/* Avatar with Status Badge */}
      <div className="relative flex-shrink-0">
        <img
          src={avatar}
          alt={company}
          className="w-10 h-10 rounded-full object-cover"
        />
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${statusDotColors[status]}`}
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-neutral-900 mb-1">
          <strong className="font-semibold">{company}</strong> {message}
        </p>
        <p className="text-xs text-neutral-500 line-clamp-2">{description}</p>
      </div>

      {/* Actions & Timestamp */}
      <div className="flex flex-col items-end gap-2 flex-shrink-0">
        <span className="text-xs text-neutral-400 whitespace-nowrap">
          {timestamp}
        </span>

        {showActions && (onAccept || onDecline) && (
          <div className="flex gap-2">
            {onDecline && (
              <button
                onClick={() => onDecline(id)}
                className="px-3 py-1.5 text-xs font-semibold text-neutral-700 border border-neutral-300 rounded-lg hover:bg-neutral-50 transition-colors duration-200"
              >
                Decline
              </button>
            )}
            {onAccept && (
              <button
                onClick={() => onAccept(id)}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-[#2D6EF7] rounded-lg hover:bg-[#1E5EE8] transition-colors duration-200"
              >
                Accept
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Example Usage:
 *
 * <NotificationItem
 *   id="notif-1"
 *   avatar="/logos/miniso.png"
 *   company="Miniso Inc."
 *   message="sent you campaign request"
 *   description="Lacus nunc massa magna venenatis elepisua a tempor viverrs."
 *   timestamp="2 minutes ago"
 *   status="warning"
 *   onAccept={(id) => console.log('Accepted:', id)}
 *   onDecline={(id) => console.log('Declined:', id)}
 * />
 */
