import React, { useEffect, useMemo, useState } from 'react';
import NotificationItem from './NotificationItem';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../services/dataService';

const TYPE_ICON = {
  badge_earned: 'fa-solid fa-award',
  level_complete: 'fa-solid fa-circle-check',
  streak: 'fa-solid fa-fire',
  credit_milestone: 'fa-solid fa-coins',
  system: 'fa-solid fa-bullhorn',
  practice_reminder: 'fa-solid fa-pen-nib',
};

function formatRelativeTime(createdAt) {
  if (!createdAt) return 'Just now';

  const date = new Date(createdAt);
  if (Number.isNaN(date.getTime())) return 'Just now';

  const diffMs = Date.now() - date.getTime();
  const sec = Math.floor(diffMs / 1000);
  if (sec < 60) return 'Just now';

  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} minute${min === 1 ? '' : 's'} ago`;

  const hrs = Math.floor(min / 60);
  if (hrs < 24) return `${hrs} hour${hrs === 1 ? '' : 's'} ago`;

  const days = Math.floor(hrs / 24);
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;

  return date.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function normalizeNotification(raw) {
  return {
    id: raw.id,
    type: raw.type || 'system',
    title: raw.title || 'Notification',
    message: raw.message || '',
    icon: raw.icon || TYPE_ICON[raw.type] || 'fa-solid fa-bell',
    read: Boolean(raw.read),
    action_url: raw.action_url || '/dashboard',
    created_at: raw.created_at,
    time_ago: raw.time_ago || formatRelativeTime(raw.created_at),
  };
}

function NotificationBell({ isOpen, onToggle, onNavigate }) {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);

  const refresh = async () => {
    try {
      setLoading(true);
      const res = await getNotifications();
      const items = (res?.notifications || []).map(normalizeNotification);
      setNotifications(items);
      setUnreadCount(Number(res?.unread_count || 0));
    } catch (e) {
      console.warn('Notifications fetch failed:', e?.message || e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  useEffect(() => {
    if (isOpen) {
      refresh();
    }
  }, [isOpen]);

  const visibleUnreadIds = useMemo(
    () => notifications.filter((n) => !n.read).slice(0, 10).map((n) => n.id),
    [notifications]
  );

  useEffect(() => {
    if (!isOpen || visibleUnreadIds.length === 0) return undefined;

    const timer = setTimeout(async () => {
      try {
        const res = await markNotificationsRead(visibleUnreadIds);
        setNotifications((prev) =>
          prev.map((n) => (visibleUnreadIds.includes(n.id) ? { ...n, read: true } : n))
        );
        setUnreadCount(Number(res?.unread_count || 0));
      } catch (e) {
        console.warn('Mark-read failed:', e?.message || e);
      }
    }, 2000);

    return () => clearTimeout(timer);
  }, [isOpen, visibleUnreadIds]);

  const handleMarkAllRead = async () => {
    try {
      const res = await markAllNotificationsRead();
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      setUnreadCount(Number(res?.unread_count || 0));
    } catch (e) {
      console.warn('Mark-all-read failed:', e?.message || e);
    }
  };

  const handleView = (notification) => {
    onNavigate(notification.action_url);
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="db-icon-btn"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <i className="fa-regular fa-bell" />
        {unreadCount > 0 ? (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-semibold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] overflow-y-auto bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="flex justify-between items-center p-4 border-b border-gray-200 sticky top-0 bg-white">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <i className="fa-regular fa-bell text-blue-600" />
              Notifications
            </h3>
            <button
              type="button"
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <div className="p-6 text-sm text-gray-500">Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-3xl mb-2 text-blue-300">
                <i className="fa-regular fa-bell-slash" />
              </div>
              <p className="font-medium">No notifications yet!</p>
              <p className="text-sm mt-1">Complete lessons and practice tasks to earn achievements.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onView={handleView}
              />
            ))
          )}

          <div className="p-3 border-t border-gray-200 text-center text-sm text-gray-500 space-y-1">
            <div>Showing latest {notifications.length} notifications</div>
            <button
              type="button"
              className="text-blue-600 hover:text-blue-800"
              onClick={() => onNavigate('/notifications')}
            >
              View All Notifications
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
