import React, { useState, useRef, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import api from '../utils/api';
import './Header.css';

// SVG Icons — no emoji
const SearchIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
  </svg>
);

const BellIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/>
  </svg>
);
const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

const ChevronDown = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="6 9 12 15 18 9"/>
  </svg>
);

const ClockIcon = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
  </svg>
);

function Header() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout, isAuthenticated } = useAuth();
  const dropdownRef = useRef(null);

  // Shadow on scroll
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 4);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    const handler = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery('');
      setShowSearchHistory(false);
    }
  };

  const handleSearchFocus = async () => {
    setShowSearchHistory(true);
    if (isAuthenticated && recentSearches.length === 0) {
      try {
        const res = await api.get('/api/search/history');
        const seen = new Set();
        const unique = [];
        for (let i = res.data.searchHistory.length - 1; i >= 0; i--) {
          const q = res.data.searchHistory[i].query;
          if (!seen.has(q.toLowerCase())) {
            unique.push(q);
            seen.add(q.toLowerCase());
          }
          if (unique.length === 6) break;
        }
        setRecentSearches(unique);
      } catch (_) {}
    }
  };

  const handleSearchBlur = () => {
    setTimeout(() => setShowSearchHistory(false), 180);
  };

  const isActive = (path) => location.pathname === path;

  return (
    <header className={`app-header ${scrolled ? 'scrolled' : ''}`}>

      {/* ── Logo ── */}
      <div className="header-logo" onClick={() => navigate('/')}>
        <span className="logo-name">Pixora</span>
      </div>

      {/* ── Nav Pills ── */}
      <nav className="header-nav">
        <button
          className={`nav-pill ${isActive('/') ? 'active' : ''}`}
          onClick={() => navigate('/')}
        >
          Home
        </button>
        {isAuthenticated && (
          <button
            className={`nav-pill ${isActive('/recommendations') ? 'active' : ''}`}
            onClick={() => navigate('/recommendations')}
          >
            For you
          </button>
        )}
      </nav>

      {/* ── Search ── */}
      <div className="header-search">
        <form onSubmit={handleSearch} className="search-form">
          <span className="search-icon"><SearchIcon /></span>
          <input
            type="text"
            placeholder="Search for ideas"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={handleSearchFocus}
            onBlur={handleSearchBlur}
            className="search-input"
          />
        </form>

        {showSearchHistory && recentSearches.length > 0 && (
          <div className="search-dropdown">
            <p className="search-dropdown-label">Recent</p>
            {recentSearches.map((term, i) => (
              <div
                key={i}
                className="search-dropdown-item"
                onMouseDown={(e) => {
                  e.preventDefault();
                  navigate(`/search?q=${encodeURIComponent(term)}`);
                  setSearchQuery('');
                  setShowSearchHistory(false);
                }}
              >
                <ClockIcon />
                <span>{term}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ── Right Actions ── */}
      <div className="header-actions">
        {isAuthenticated ? (
          <>
            {/* Create button */}
            <button
              className="header-create-btn"
              onClick={() => navigate('/create')}
              title="Create Pin"
            >
              <PlusIcon />
              <span>Create</span>
            </button>

            {/* Notification bell */}
            <button className="header-icon-btn" title="Notifications">
              <BellIcon />
            </button>

            {/* Avatar dropdown */}
            <div className="avatar-dropdown-wrapper" ref={dropdownRef}>
              <button
                className="header-avatar"
                onClick={() => setShowDropdown(d => !d)}
                title="Account"
              >
                <span className="avatar-letter">
                  {user?.displayName?.charAt(0).toUpperCase() || user?.username?.charAt(0).toUpperCase() || 'U'}
                </span>
                <ChevronDown />
              </button>

              {showDropdown && (
                <div className="avatar-dropdown">
                  <div className="avatar-dropdown-profile">
                    <div className="avatar-dropdown-pic">
                      {user?.displayName?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <p className="avatar-dropdown-name">{user?.displayName || user?.username}</p>
                      <p className="avatar-dropdown-email">{user?.email}</p>
                    </div>
                  </div>

                  <div className="avatar-dropdown-divider" />

                  <button className="avatar-dropdown-item" onClick={() => { navigate(`/${user?.username}`); setShowDropdown(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                    </svg>
                    Profile
                  </button>

                  <button className="avatar-dropdown-item" onClick={() => { navigate('/create'); setShowDropdown(false); }}>
                    <PlusIcon />
                    Create Pin
                  </button>

                  <div className="avatar-dropdown-divider" />

                  <button className="avatar-dropdown-item danger" onClick={() => { logout(); navigate('/login'); setShowDropdown(false); }}>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
                    </svg>
                    Log out
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <button className="header-login-btn" onClick={() => navigate('/login')}>Log in</button>
            <button className="header-signup-btn" onClick={() => navigate('/signup')}>Sign up</button>
          </>
        )}
      </div>

    </header>
  );
}

export default Header;