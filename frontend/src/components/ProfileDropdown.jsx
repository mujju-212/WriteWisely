import React from 'react';

const AVATAR_COLORS = [
  'bg-blue-500',
  'bg-purple-500',
  'bg-green-500',
  'bg-orange-500',
  'bg-pink-500',
  'bg-teal-500',
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

  return (
    <div className="relative">
      <button
        type="button"
        onClick={onToggle}
        className="flex items-center gap-2 hover:bg-gray-100 rounded-lg px-2 py-1"
        aria-expanded={isOpen}
      >
        {user?.profile_picture_url ? (
          <img
            src={user.profile_picture_url}
            alt="avatar"
            className="w-9 h-9 rounded-full object-cover"
          />
        ) : (
          <div className={`w-9 h-9 rounded-full flex items-center justify-center text-white font-semibold text-sm ${avatarColor}`}>
            {initials}
          </div>
        )}

        <span className="text-sm font-medium hidden sm:block text-gray-800">
          {user?.name || 'User'}
        </span>

        <i className={`fa-solid fa-chevron-down text-xs text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-full mt-2 w-72 bg-white border border-gray-200 rounded-xl shadow-xl z-50">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center gap-3">
              {user?.profile_picture_url ? (
                <img
                  src={user.profile_picture_url}
                  alt="avatar"
                  className="w-12 h-12 rounded-full object-cover"
                />
              ) : (
                <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${avatarColor}`}>
                  {initials}
                </div>
              )}
              <div>
                <p className="font-semibold text-gray-900">{user?.name || 'User'}</p>
                <p className="text-xs text-gray-500">{user?.email || 'No email'}</p>
                <p className="text-xs text-gray-500 flex items-center gap-1 mt-0.5">
                  <i className="fa-solid fa-user-graduate" />
                  {user?.role || 'student'}
                </p>
              </div>
            </div>
          </div>

          <div className="p-3 border-b border-gray-200">
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Level</p>
                <p className="font-bold text-sm text-gray-900"><i className="fa-solid fa-chart-line mr-1 text-blue-600" />{stats.level}/30</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Credits</p>
                <p className="font-bold text-sm text-gray-900"><i className="fa-solid fa-coins mr-1 text-amber-500" />{stats.credits}</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Streak</p>
                <p className="font-bold text-sm text-gray-900"><i className="fa-solid fa-fire mr-1 text-orange-500" />{stats.streak} days</p>
              </div>
              <div className="bg-gray-50 rounded-lg p-2 text-center">
                <p className="text-xs text-gray-500">Accuracy</p>
                <p className="font-bold text-sm text-gray-900"><i className="fa-solid fa-bullseye mr-1 text-green-600" />{stats.accuracy}%</p>
              </div>
            </div>
            <p className="text-center text-xs text-indigo-600 mt-2 font-medium flex items-center justify-center gap-1">
              <i className="fa-solid fa-award" />
              {stats.rank}
            </p>
          </div>

          <div className="p-2 border-b border-gray-200">
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
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-100 transition-colors text-left"
              >
                <span className="w-4 text-center text-gray-500"><i className={item.icon} /></span>
                <span>{item.label}</span>
              </button>
            ))}
          </div>

          <div className="p-3 border-b border-gray-200">
            <div className="flex items-center justify-between px-3">
              <div className="flex items-center gap-2 text-sm text-gray-700">
                <span className="w-4 text-center">
                  <i className={theme === 'dark' ? 'fa-solid fa-moon text-indigo-600' : 'fa-solid fa-sun text-amber-500'} />
                </span>
                <span>{theme === 'dark' ? 'Dark Mode' : 'Light Mode'}</span>
              </div>
              <button
                type="button"
                onClick={toggleTheme}
                className={`relative w-11 h-6 rounded-full transition-colors ${theme === 'dark' ? 'bg-blue-500' : 'bg-gray-300'}`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${theme === 'dark' ? 'translate-x-6' : 'translate-x-1'}`}
                />
              </button>
            </div>
          </div>

          <div className="p-2">
            <button
              type="button"
              onClick={onLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 transition-colors text-left"
            >
              <span className="w-4 text-center"><i className="fa-solid fa-right-from-bracket" /></span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default ProfileDropdown;
