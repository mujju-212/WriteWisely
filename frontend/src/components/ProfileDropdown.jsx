import React from 'react';

const AVATAR_COLORS = [
  '#3B82F6',
  '#8B5CF6',
  '#10B981',
  '#F59E0B',
  '#EC4899',
  '#14B8A6',
];

function getInitials(name = '') {
  const clean = name.trim();
  if (!clean) return 'WW';
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  return clean.slice(0, 2).toUpperCase();
}

function getAvatarColor(name = '') {
  if (!name) return AVATAR_COLORS[0];
  const hash = Array.from(name).reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

function ProfileDropdown({
  isOpen,
  onToggle,
  user,
  stats,
  theme,
  toggleTheme,
  onNavigate,
  onLogout,
}) {
  const initials = getInitials(user?.name);
  const avatarColor = getAvatarColor(user?.name);
  const isDark = theme === 'dark';

  const palette = {
    panelBg: isDark ? '#0F172A' : '#FFFFFF',
    panelBorder: isDark ? '#334155' : '#E5E7EB',
    panelShadow: isDark ? '0 18px 44px rgba(2, 6, 23, 0.55)' : '0 18px 44px rgba(15, 23, 42, 0.16)',
    textStrong: isDark ? '#E2E8F0' : '#111827',
    textMuted: isDark ? '#94A3B8' : '#6B7280',
    hoverBg: isDark ? '#1E293B' : '#F3F4F6',
    statBg: isDark ? '#111827' : '#F8FAFC',
    accent: isDark ? '#A5B4FC' : '#4F46E5',
    switchOn: '#3B82F6',
    switchOff: isDark ? '#334155' : '#D1D5DB',
    danger: '#EF4444',
  };

  const menuButtonStyle = {
    width: '100%',
    border: 'none',
    background: 'transparent',
    color: palette.textStrong,
    display: 'flex',
    alignItems: 'center',
    gap: '0.7rem',
    padding: '0.58rem 0.72rem',
    borderRadius: 10,
    fontSize: '0.88rem',
    cursor: 'pointer',
    textAlign: 'left',
    fontFamily: 'inherit',
  };

  return (
    <div style={{ position: 'relative' }}>
      <button
        type="button"
        onClick={onToggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          border: 'none',
          cursor: 'pointer',
          background: isOpen ? palette.hoverBg : 'transparent',
          borderRadius: 10,
          padding: '0.25rem 0.45rem',
          color: palette.textStrong,
          fontFamily: 'inherit',
        }}
        aria-expanded={isOpen}
      >
        {user?.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt="avatar"
            style={{ width: 36, height: 36, borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
            fontWeight: 700,
            fontSize: '0.78rem',
            background: avatarColor,
          }}>
            {initials}
          </div>
        )}

        <span style={{ fontSize: '0.88rem', fontWeight: 600, color: palette.textStrong }}>
          {user?.name || 'User'}
        </span>

        <i
          className="fa-solid fa-chevron-down"
          style={{
            fontSize: '0.68rem',
            color: palette.textMuted,
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.2s ease',
          }}
        />
      </button>

      {isOpen ? (
        <div style={{
          position: 'absolute',
          right: 0,
          top: 'calc(100% + 8px)',
          width: 300,
          background: palette.panelBg,
          border: `1px solid ${palette.panelBorder}`,
          borderRadius: 14,
          boxShadow: palette.panelShadow,
          zIndex: 60,
          overflow: 'hidden',
        }}>
          <div style={{ padding: '0.95rem 1rem', borderBottom: `1px solid ${palette.panelBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.72rem' }}>
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt="avatar"
                  style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover' }}
                />
              ) : (
                <div style={{
                  width: 46,
                  height: 46,
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'white',
                  fontWeight: 700,
                  fontSize: '1rem',
                  background: avatarColor,
                }}>
                  {initials}
                </div>
              )}
              <div>
                <p style={{ margin: 0, fontWeight: 700, color: palette.textStrong, fontSize: '0.92rem' }}>{user?.name || 'User'}</p>
                <p style={{ margin: '2px 0 0', fontSize: '0.76rem', color: palette.textMuted }}>{user?.email || 'No email'}</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.76rem', color: palette.textMuted, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <i className="fa-solid fa-user-graduate" />
                  {user?.role || 'student'}
                </p>
              </div>
            </div>
          </div>

          <div style={{ padding: '0.82rem', borderBottom: `1px solid ${palette.panelBorder}` }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
              <div style={{ background: palette.statBg, borderRadius: 10, padding: '0.5rem', textAlign: 'center', border: `1px solid ${palette.panelBorder}` }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: palette.textMuted }}>Level</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: palette.textStrong }}><i className="fa-solid fa-chart-line" style={{ marginRight: 5, color: '#60A5FA' }} />{stats.level}/30</p>
              </div>
              <div style={{ background: palette.statBg, borderRadius: 10, padding: '0.5rem', textAlign: 'center', border: `1px solid ${palette.panelBorder}` }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: palette.textMuted }}>Credits</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: palette.textStrong }}><i className="fa-solid fa-coins" style={{ marginRight: 5, color: '#F59E0B' }} />{stats.credits}</p>
              </div>
              <div style={{ background: palette.statBg, borderRadius: 10, padding: '0.5rem', textAlign: 'center', border: `1px solid ${palette.panelBorder}` }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: palette.textMuted }}>Streak</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: palette.textStrong }}><i className="fa-solid fa-fire" style={{ marginRight: 5, color: '#FB923C' }} />{stats.streak} days</p>
              </div>
              <div style={{ background: palette.statBg, borderRadius: 10, padding: '0.5rem', textAlign: 'center', border: `1px solid ${palette.panelBorder}` }}>
                <p style={{ margin: 0, fontSize: '0.7rem', color: palette.textMuted }}>Accuracy</p>
                <p style={{ margin: '3px 0 0', fontSize: '0.82rem', fontWeight: 700, color: palette.textStrong }}><i className="fa-solid fa-bullseye" style={{ marginRight: 5, color: '#22C55E' }} />{stats.accuracy}%</p>
              </div>
            </div>
            <p style={{ textAlign: 'center', margin: '0.55rem 0 0', fontSize: '0.76rem', fontWeight: 700, color: palette.accent }}>
              <i className="fa-solid fa-award" />
              <span style={{ marginLeft: 5 }}>{stats.rank}</span>
            </p>
          </div>

          <div style={{ padding: '0.48rem', borderBottom: `1px solid ${palette.panelBorder}` }}>
            {[
              { icon: 'fa-regular fa-user', label: 'My Profile', path: '/settings#profile' },
              { icon: 'fa-solid fa-chart-pie', label: 'My Analytics', path: '/analytics' },
              { icon: 'fa-solid fa-trophy', label: 'My Badges', path: '/analytics#badges' },
              { icon: 'fa-solid fa-gear', label: 'Settings', path: '/settings' },
            ].map((item) => (
              <button
                key={item.label}
                type="button"
                onClick={() => onNavigate(item.path)}
                style={menuButtonStyle}
              >
                <span style={{ width: 18, textAlign: 'center', color: palette.textMuted }}><i className={item.icon} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div style={{ padding: '0.74rem 0.9rem', borderBottom: `1px solid ${palette.panelBorder}` }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.7rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: palette.textStrong, fontSize: '0.87rem', fontWeight: 600 }}>
                <span style={{ width: 18, textAlign: 'center' }}>
                  <i className={theme === 'dark' ? 'fa-solid fa-moon' : 'fa-solid fa-sun'} style={{ color: theme === 'dark' ? '#A5B4FC' : '#F59E0B' }} />
                </span>
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                style={{
                  width: 44,
                  height: 24,
                  borderRadius: 999,
                  border: 'none',
                  cursor: 'pointer',
                  background: theme === 'dark' ? palette.switchOn : palette.switchOff,
                  position: 'relative',
                  transition: 'background 0.2s ease',
                }}
              >
                <span
                  style={{
                    position: 'absolute',
                    top: 3,
                    left: 3,
                    width: 18,
                    height: 18,
                    borderRadius: '50%',
                    background: '#FFFFFF',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.2)',
                    transform: theme === 'dark' ? 'translateX(20px)' : 'translateX(0px)',
                    transition: 'transform 0.2s ease',
                  }}
                />
              </button>
            </div>
          </div>

          <div style={{ padding: '0.5rem' }}>
            <button
              type="button"
              onClick={onLogout}
              style={{
                ...menuButtonStyle,
                color: palette.danger,
              }}
            >
              <span style={{ width: 18, textAlign: 'center' }}><i className="fa-solid fa-right-from-bracket" /></span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileDropdown;
