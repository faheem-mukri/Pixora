import React from 'react';
import { useNavigate } from 'react-router-dom';
import './UserCard.css';

function UserCard({ user }) {
  const navigate = useNavigate();

  const handleClick = () => {
    navigate(`/${user.username}`);
  };

  return (
    <div className="user-card" onClick={handleClick}>
      <div className="user-card-avatar">
        {(user.displayName || user.username).charAt(0).toUpperCase()}
      </div>
      <div className="user-card-info">
        <h3 className="user-card-name">{user.displayName || user.username}</h3>
        <p className="user-card-username">@{user.username}</p>
        {user.bio && <p className="user-card-bio">{user.bio}</p>}
        <div className="user-card-stats">
          <span>{user.followersCount || 0} followers</span>
          <span className="user-card-dot">•</span>
          <span>{user.followingCount || 0} following</span>
        </div>
      </div>
    </div>
  );
}

export default UserCard;
