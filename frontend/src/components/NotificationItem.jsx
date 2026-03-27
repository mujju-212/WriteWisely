import React from 'react';

function NotificationItem({ notification, onView }) {
  const unread = !notification.read;

  return (
    <div
      className={`flex items-start gap-3 p-4 border-b border-gray-100 transition-colors ${
        unread
          ? 'bg-blue-50 hover:bg-blue-100/70'
          : 'bg-white hover:bg-gray-50'
      }`}
    >
      <div className="mt-1.5 flex-shrink-0 w-2 h-2">
        {unread ? <div className="w-2 h-2 bg-blue-500 rounded-full" /> : null}
      </div>

      <span className="text-base leading-none flex-shrink-0 w-9 h-9 rounded-lg bg-blue-100 text-blue-600 flex items-center justify-center">
        <i className={notification.icon || 'fa-solid fa-bell'} />
      </span>

      <div className="flex-1 min-w-0">
        <p className={`text-sm ${unread ? 'font-semibold text-gray-900' : 'font-normal text-gray-900'}`}>
          {notification.title}
        </p>

        <p className="text-sm text-gray-600 mt-0.5 break-words">
          {notification.message}
        </p>

        <div className="flex items-center justify-between mt-2 gap-3">
          <span className="text-xs text-gray-400">{notification.time_ago || 'Just now'}</span>
          <button
            type="button"
            onClick={() => onView(notification)}
            className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
          >
            View <i className="fa-solid fa-arrow-right-long" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
