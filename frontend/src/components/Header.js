import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import './Header.css';

function Header() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchQuery('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(e);
    }
  };

  const handleLogoClick = () => {
    navigate('/');
  };

  const handleUserClick = () => {
    if (isAuthenticated) {
      logout();
      navigate('/login');
    } else {
      navigate('/login');
    }
  };

  return (
    <header className="app-header">
      {/* Logo on the left */}
      <div className="header-left">
        <button className="logo" onClick={handleLogoClick} >
          <span className="logo-text">Pixora</span>
        </button>
      </div>

      {/* Search bar in the middle */}
      <div className="header-center">
        <form onSubmit={handleSearch} className="header-search-form">
          <input
            type="text"
            placeholder="Search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onKeyPress={handleKeyPress}
            className="header-search-input"
          />
        </form>
      </div>

      {/* User section on the right */}
      <div className="header-right">
        {isAuthenticated ? (
          <div className="user-menu">
            <span className="user-name">{user?.displayName || user?.username}</span>
            <button className="user-icon-button" onClick={handleUserClick} title="Logout">
              <span className="user-icon">👤</span>
            </button>
          </div>
        ) : (
          <button className="user-icon-button" onClick={handleUserClick} title="Login">
            <span className="user-icon">👤</span>
          </button>
        )}
      </div>
    </header>
  );
}

export default Header;
