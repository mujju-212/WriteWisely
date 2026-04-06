import React, { useEffect, useMemo, useState } from 'react';
import NotificationItem from './NotificationItem';
import {
  getNotifications,
  markAllNotificationsRead,
  markNotificationsRead,
} from '../services/dataService';
import { useTheme } from '../context/ThemeContext';

const TYPE_ICON = {
  badge_earned: 'fa-solid fa-award',
  level_complete: 'fa-solid fa-circle-check',
  streak: 'fa-solid fa-fire',
  credit_milestone: 'fa-solid fa-coins',
  system: 'fa-solid fa-bullhorn',
  practice_reminder: 'fa-solid fa-pen-nib',
  achievement: 'fa-solid fa-trophy',
  reminder: 'fa-solid fa-bell',
  badge: 'fa-solid fa-award',
  learning: 'fa-solid fa-graduation-cap',
};

function isFontAwesomeClass(iconValue) {
  return typeof iconValue === 'string' && iconValue.includes('fa-');
}

function resolveIcon(raw) {
  const type = raw?.type || 'system';
  const typeIcon = TYPE_ICON[type] || TYPE_ICON.system;
  const rawIcon = raw?.icon;

  if (isFontAwesomeClass(rawIcon)) {
    if (rawIcon.includes('fa-solid') || rawIcon.includes('fa-regular') || rawIcon.includes('fa-brands')) {
      return { iconClass: rawIcon, iconText: null };
    }
    return { iconClass: `fa-solid ${rawIcon}`.trim(), iconText: null };
  }

  if (typeof rawIcon === 'string' && rawIcon.trim()) {
    return { iconClass: typeIcon, iconText: rawIcon.trim() };
  }

  return { iconClass: typeIcon, iconText: null };
}

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
  const { iconClass, iconText } = resolveIcon(raw);

  return {
    id: raw.id,
    type: raw.type || 'system',
    title: raw.title || 'Notification',
    message: raw.message || '',
    icon: iconClass || 'fa-solid fa-bell',
    icon_text: iconText,
    read: Boolean(raw.read),
    action_url: raw.action_url || '/dashboard',
    created_at: raw.created_at,
    time_ago: raw.time_ago || formatRelativeTime(raw.created_at),
  };
}

function NotificationBell({ isOpen, onToggle, onNavigate }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const palette = {
    panelBg: isDark ? '#0F172A' : '#FFFFFF',
    panelBorder: isDark ? '#334155' : '#E5E7EB',
    panelShadow: isDark ? '0 18px 44px rgba(2, 6, 23, 0.55)' : '0 18px 44px rgba(15, 23, 42, 0.16)',
    headerBg: isDark ? '#0F172A' : '#FFFFFF',
    textStrong: isDark ? '#E2E8F0' : '#111827',
    textMuted: isDark ? '#94A3B8' : '#6B7280',
    action: isDark ? '#93C5FD' : '#2563EB',
    actionHover: isDark ? '#BFDBFE' : '#1D4ED8',
    divider: isDark ? '#334155' : '#E5E7EB',
    emptyIcon: isDark ? '#60A5FA' : '#93C5FD',
    badgeBg: '#EF4444',
    badgeText: '#FFFFFF',
  };

  const refresh = async () => {
    try {
      setLoading(true);
      const limit = showAll ? 200 : 10;
      const res = await getNotifications(limit);
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
    if (!isOpen && showAll) {
      setShowAll(false);
    }
  }, [isOpen, showAll]);

  const visibleUnreadIds = useMemo(
    () => notifications.filter((n) => !n.read).map((n) => n.id),
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

  const handleToggleShowAll = () => {
    setShowAll((prev) => !prev);
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        className="db-icon-btn"
        aria-label="Notifications"
        aria-expanded={isOpen}
      >
        <i className="fa-regular fa-bell" />
        {unreadCount > 0 ? (
          <span style={{
            position: 'absolute',
            top: -4,
            right: -4,
            background: palette.badgeBg,
            color: palette.badgeText,
            fontSize: '0.68rem',
            borderRadius: '50%',
            width: 20,
            height: 20,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        ) : null}
      </button>

      {isOpen ? (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 384,
          maxHeight: 500,
          overflowY: 'auto',
          background: palette.panelBg,
          border: `1px solid ${palette.panelBorder}`,
          borderRadius: 12,
          boxShadow: palette.panelShadow,
          zIndex: 50,
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '1rem',
            borderBottom: `1px solid ${palette.divider}`,
            position: 'sticky',
            top: 0,
            background: palette.headerBg,
          }}>
            <h3 style={{ fontWeight: 700, color: palette.textStrong, display: 'flex', alignItems: 'center', gap: 8, margin: 0, fontSize: '0.95rem' }}>
              <i className="fa-regular fa-bell" style={{ color: palette.action }} />
              Notifications
            </h3>
            <button
              type="button"
              onClick={handleMarkAllRead}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: '0.82rem',
                color: palette.action,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = palette.actionHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = palette.action;
              }}
            >
              Mark all read
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '1.5rem', fontSize: '0.85rem', color: palette.textMuted }}>Loading notifications...</div>
          ) : notifications.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: palette.textMuted }}>
              <div style={{ fontSize: '1.9rem', marginBottom: 8, color: palette.emptyIcon }}>
                <i className="fa-regular fa-bell-slash" />
              </div>
              <p style={{ fontWeight: 600, margin: 0, color: palette.textStrong }}>No notifications yet!</p>
              <p style={{ fontSize: '0.82rem', marginTop: 4 }}>Complete lessons and practice tasks to earn achievements.</p>
            </div>
          ) : (
            notifications.map((notification) => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onView={handleView}
                isDark={isDark}
              />
            ))
          )}

          <div style={{
            padding: '0.75rem',
            borderTop: `1px solid ${palette.divider}`,
            textAlign: 'center',
            fontSize: '0.82rem',
            color: palette.textMuted,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}>
            <div>{showAll ? `Showing ${notifications.length} notifications` : `Showing latest ${notifications.length} notifications`}</div>
            <button
              type="button"
              style={{
                border: 'none',
                background: 'transparent',
                color: palette.action,
                cursor: 'pointer',
                fontWeight: 600,
                fontFamily: 'inherit',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.color = palette.actionHover;
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = palette.action;
              }}
              onClick={handleToggleShowAll}
            >
              {showAll ? 'Show Latest Only' : 'View All Notifications'}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default NotificationBell;
