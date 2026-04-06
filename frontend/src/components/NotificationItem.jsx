import React from 'react';

function NotificationItem({ notification, onView, isDark = false }) {
  const unread = !notification.read;
  const iconClass =
    typeof notification.icon === 'string' && notification.icon.includes('fa-')
      ? notification.icon
      : null;
  const iconText =
    typeof notification.icon_text === 'string' && notification.icon_text.trim()
      ? notification.icon_text.trim()
      : null;

  const palette = {
    itemBgUnread: isDark ? 'rgba(59,130,246,0.14)' : '#EFF6FF',
    itemBgUnreadHover: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE',
    itemBgRead: isDark ? '#0F172A' : '#FFFFFF',
    itemBgReadHover: isDark ? '#1E293B' : '#F9FAFB',
    border: isDark ? '#334155' : '#F3F4F6',
    unreadDot: isDark ? '#60A5FA' : '#3B82F6',
    iconBg: isDark ? 'rgba(59,130,246,0.2)' : '#DBEAFE',
    iconColor: isDark ? '#93C5FD' : '#2563EB',
    title: isDark ? '#E2E8F0' : '#111827',
    message: isDark ? '#CBD5E1' : '#4B5563',
    time: isDark ? '#94A3B8' : '#9CA3AF',
    action: isDark ? '#93C5FD' : '#2563EB',
    actionHover: isDark ? '#BFDBFE' : '#1D4ED8',
  };

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.75rem',
        padding: '1rem',
        borderBottom: `1px solid ${palette.border}`,
        transition: 'background 0.15s ease',
        background: unread ? palette.itemBgUnread : palette.itemBgRead,
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = unread ? palette.itemBgUnreadHover : palette.itemBgReadHover;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = unread ? palette.itemBgUnread : palette.itemBgRead;
      }}
    >
      <div style={{ marginTop: '0.4rem', flexShrink: 0, width: 8, height: 8 }}>
        {unread ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: palette.unreadDot }} /> : null}
      </div>

      <span style={{
        fontSize: '1rem',
        lineHeight: 1,
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: palette.iconBg,
        color: palette.iconColor,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
        {iconText ? (
          <span aria-hidden="true" style={{ fontSize: '1.05rem', lineHeight: 1 }}>{iconText}</span>
        ) : (
          <i className={iconClass || 'fa-solid fa-bell'} aria-hidden="true" />
        )}
      </span>

      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: '0.875rem', fontWeight: unread ? 700 : 500, color: palette.title, margin: 0 }}>
          {notification.title}
        </p>

        <p style={{ fontSize: '0.875rem', color: palette.message, marginTop: 2, marginBottom: 0, wordBreak: 'break-word' }}>
          {notification.message}
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8, gap: '0.75rem' }}>
          <span style={{ fontSize: '0.75rem', color: palette.time }}>{notification.time_ago || 'Just now'}</span>
          <button
            type="button"
            onClick={() => onView(notification)}
            style={{
              border: 'none',
              background: 'transparent',
              color: palette.action,
              fontSize: '0.75rem',
              display: 'flex',
              alignItems: 'center',
              gap: 4,
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
            View <i className="fa-solid fa-arrow-right-long" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default NotificationItem;
