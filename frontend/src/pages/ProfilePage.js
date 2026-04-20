import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../utils/api';
import { useAuth } from '../hooks/useAuth';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ImageCard from '../components/ImageCard';
import './ProfilePage.css';

const ShareIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/><line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
  </svg>
);

const EditIcon = () => (
  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

const PlusIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
  </svg>
);

function ProfilePage() {
  const navigate = useNavigate();
  const { username } = useParams();
  const { user: currentUser, isAuthenticated } = useAuth();

  const [profile, setProfile] = useState(null);
  const [savedPins, setSavedPins] = useState([]);
  const [createdPins, setCreatedPins] = useState([]);
  const [createdLoading, setCreatedLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({ displayName: '', bio: '' });
  const [activeTab, setActiveTab] = useState('saved');
  const [saveError, setSaveError] = useState('');
  const [saving, setSaving] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Follow/unfollow state
  const [isFollowing, setIsFollowing] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);

  const isOwnProfile = currentUser?.username === username;

  const fetchProfileData = useCallback(async () => {
    try {
      setLoading(true);
      const userRes = await api.get(`/api/auth/user/${username}`);
      setProfile(userRes.data);
      setFormData({
        displayName: userRes.data.displayName || '',
        bio: userRes.data.bio || ''
      });

      // Set follower/following counts
      setFollowerCount(userRes.data.followers?.length || 0);
      setFollowingCount(userRes.data.following?.length || 0);

      // Check if current user is following this profile
      if (isAuthenticated && !isOwnProfile) {
        try {
          const followRes = await api.get(`/api/auth/following/${username}`);
          setIsFollowing(followRes.data.following);
        } catch (_) {}
      }

      // Fetch saved pins - only for own profile (private data)
      if (isOwnProfile && isAuthenticated) {
        try {
          const savedPinsRes = await api.get('/api/pins/saved', { params: { page: 1, limit: 100 } });
          setSavedPins(savedPinsRes.data.pins || []);
        } catch (err) {
          console.error('Error fetching saved pins:', err);
        }
      } else {
        // Other users can't see saved pins (private)
        setSavedPins([]);
      }

      setLoading(false);
    } catch (err) {
      setLoading(false);
    }
  }, [username, isAuthenticated, isOwnProfile]);

  useEffect(() => { fetchProfileData(); }, [fetchProfileData]);

  const handleSaveProfile = async () => {
    setSaveError('');
    setSaving(true);
    try {
      const res = await api.put('/api/auth/profile', {
        displayName: formData.displayName,
        bio: formData.bio
      });
      setProfile(prev => ({ 
        ...prev, 
        displayName: res.data.user.displayName,
        bio: formData.bio // Update bio in local state
      }));
      setIsEditing(false);
    } catch (err) {
      setSaveError(err.response?.data?.msg || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const handleShareProfile = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handlePinClick = (imageId) => navigate(`/pin/${imageId}`);

  const handleFollowToggle = async () => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }

    setFollowLoading(true);
    try {
      if (isFollowing) {
        await api.post(`/api/auth/unfollow/${username}`);
        setIsFollowing(false);
        setFollowerCount(prev => prev - 1);
      } else {
        await api.post(`/api/auth/follow/${username}`);
        setIsFollowing(true);
        setFollowerCount(prev => prev + 1);
      }
    } catch (err) {
      console.error('Follow/unfollow error:', err);
    } finally {
      setFollowLoading(false);
    }
  };

  const fetchCreatedPins = async () => {
    if (createdPins.length > 0) return; // already loaded
    setCreatedLoading(true);
    try {
      const res = await api.get(`/api/pins/created/${username}`);
      setCreatedPins(res.data.pins || []);
      console.log("IMG:", res.data.pins[0]);
      console.log("W/H:", res.data.pins[0].width, res.data.pins[0].height);
    } catch (_) {}
    setCreatedLoading(false);
  };

  const handleDeletePin = async (imageId) => {
    if (!window.confirm('Delete this pin? This cannot be undone.')) return;
    try {
      await api.delete(`/api/pins/${encodeURIComponent(imageId)}`);
      setCreatedPins(prev => prev.filter(p => p.id !== imageId));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete pin');
    }
  };

  if (loading) {
    return (
      <div className="profile-page">
        <div className="profile-skeleton">
          <div className="profile-sk-avatar skeleton" />
          <div className="profile-sk-name skeleton" />
          <div className="profile-sk-sub skeleton" />
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="profile-page">
        <div className="profile-not-found">
          <h2>User not found</h2>
          <button onClick={() => navigate('/')}>Go home</button>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-page">

      {/* ── Profile Header ── */}
      <div className="profile-header">
        <div className="profile-avatar">
          {profile.displayName?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase()}
        </div>

        <h1 className="profile-name">{profile.displayName || profile.username}</h1>
        <p className="profile-handle">@{profile.username}</p>

        {profile.bio && (
          <p className="profile-bio">{profile.bio}</p>
        )}

        <div className="profile-stats">
          <div className="profile-stat">
            <span className="profile-stat-num">{followerCount}</span>
            <span className="profile-stat-label">followers</span>
          </div>
          <div className="profile-stat-dot" />
          <div className="profile-stat">
            <span className="profile-stat-num">{followingCount}</span>
            <span className="profile-stat-label">following</span>
          </div>
        </div>

        <div className="profile-actions">
          {isOwnProfile ? (
            <>
              <button className="profile-btn-secondary" onClick={handleShareProfile}>
                {copied ? 'Copied!' : 'Share profile'}
              </button>
              <button className="profile-btn-secondary" onClick={() => setIsEditing(true)}>
                <EditIcon /> Edit profile
              </button>
              <button className="profile-btn-create" onClick={() => navigate('/create')}>
                <PlusIcon /> Create pin
              </button>
            </>
          ) : (
            <>
              <button className="profile-btn-secondary" onClick={handleShareProfile}>
                <ShareIcon /> {copied ? 'Copied!' : 'Share'}
              </button>
              <button 
                className={isFollowing ? "profile-btn-secondary" : "profile-btn-primary"}
                onClick={handleFollowToggle}
                disabled={followLoading}
              >
                {followLoading ? 'Loading...' : isFollowing ? 'Following' : 'Follow'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* ── Tabs ── */}
      <div className="profile-tabs">
        <button
          className={`profile-tab ${activeTab === 'saved' ? 'active' : ''}`}
          onClick={() => setActiveTab('saved')}
        >
          Saved
        </button>
        <button
          className={`profile-tab ${activeTab === 'created' ? 'active' : ''}`}
          onClick={() => { setActiveTab('created'); fetchCreatedPins(); }}
        >
          Created
        </button>
      </div>

      {/* ── Content ── */}
      <div className="profile-content">

        {activeTab === 'saved' && (
          <>
            {!isOwnProfile ? (
              <div className="profile-empty">
                <div className="profile-empty-icon">🔒</div>
                <h3>Saved pins are private</h3>
                <p>Only {profile.displayName || profile.username} can see their saved pins.</p>
              </div>
            ) : savedPins.length > 0 ? (
              <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 2, 750: 3, 900: 4, 1200: 5, 1500: 6 }}
          >
            <Masonry gutter="12px">
              {savedPins.map((image) => (
                <ImageCard
                  key={image.id}
                  image={image}
                  onClick={handlePinClick}
                />
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            ) : (
              <div className="profile-empty">
                <div className="profile-empty-icon">📌</div>
                <h3>Nothing saved yet</h3>
                <p>Save pins by clicking the Save button on any image.</p>
                <button className="profile-btn-primary" onClick={() => navigate('/')}>
                  Explore ideas
                </button>
              </div>
            )}
          </>
        )}

        {activeTab === 'created' && (
          <>
            {createdLoading ? (
              <div className="profile-skeleton" style={{padding:'40px 0'}}>
                <div style={{color:'var(--text-tertiary)',fontSize:'14px'}}>Loading...</div>
              </div>
            ) : createdPins.length > 0 ? (
              <ResponsiveMasonry
                columnsCountBreakPoints={{ 350: 2, 600: 3, 900: 4, 1200: 5, 1500: 6 }}
              >
                <Masonry gutter="12px">
                  {createdPins.map((pin) => (
                      <ImageCard
                        key={pin.id}
                        image={pin}
                        onClick={handlePinClick}
                      />
                  ))}
                </Masonry>
              </ResponsiveMasonry>
            ) : (
              <div className="profile-empty">
                <div className="profile-empty-icon">🎨</div>
                <h3>No pins created yet</h3>
                <p>
                  {isOwnProfile
                    ? 'Pins you create will live here.'
                    : `${profile.displayName || profile.username} hasn't created any pins yet.`}
                </p>
                {isOwnProfile && (
                  <button className="profile-btn-create" onClick={() => navigate('/create')}>
                    <PlusIcon /> Create your first pin
                  </button>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {/* ── Edit Modal ── */}
      {isEditing && (
        <div className="edit-modal-backdrop" onClick={(e) => e.target === e.currentTarget && setIsEditing(false)}>
          <div className="edit-modal">
            <div className="edit-modal-header">
              <h2>Edit profile</h2>
              <button className="edit-modal-close" onClick={() => setIsEditing(false)}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>

            {/* Avatar preview */}
            <div className="edit-modal-avatar">
              {formData.displayName?.charAt(0).toUpperCase() || profile.username?.charAt(0).toUpperCase()}
            </div>

            <div className="edit-form">
              <div className="edit-field">
                <label>Display name</label>
                <input
                  name="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(p => ({ ...p, displayName: e.target.value }))}
                  placeholder="Your name"
                  maxLength={50}
                />
                <span className="edit-char-count">{formData.displayName.length}/50</span>
              </div>

              <div className="edit-field">
                <label>About</label>
                <textarea
                  name="bio"
                  value={formData.bio}
                  onChange={(e) => setFormData(p => ({ ...p, bio: e.target.value }))}
                  placeholder="Tell people about yourself"
                  rows={3}
                  maxLength={200}
                />
                <span className="edit-char-count">{formData.bio.length}/200</span>
              </div>

              <div className="edit-field">
                <label>Username</label>
                <input value={`@${profile.username}`} disabled className="edit-input-disabled" />
              </div>
            </div>

            {saveError && <p className="edit-error">{saveError}</p>}

            <div className="edit-modal-actions">
              <button className="profile-btn-secondary" onClick={() => setIsEditing(false)} disabled={saving}>
                Cancel
              </button>
              <button className="profile-btn-primary" onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;