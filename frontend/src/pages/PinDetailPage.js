import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api, { savePin, unsavePin, checkPinSaved, likePin, unlikePin, checkPinLiked, getPinLikes } from '../utils/api';
import Masonry, { ResponsiveMasonry } from 'react-responsive-masonry';
import ImageCard from '../components/ImageCard';
import './PinDetailPage.css';

function PinDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [image, setImage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Save states
  const [isSaved, setIsSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [checkingSaved, setCheckingSaved] = useState(true);
  
  // Like states
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [liking, setLiking] = useState(false);
  
  const [copied, setCopied] = useState(false);
  const [relatedImages, setRelatedImages] = useState([]);

  useEffect(() => {
    const fetchPinDetails = async () => {
      try {
        setLoading(true);
        setError(null);

        let cleanId = id;

        // 🔥 REMOVE cloudinary folder if present
        if (cleanId.includes('/')) {
          cleanId = cleanId.split('/').pop();
        }

        let response;

        if (cleanId.startsWith('pin_')) {
          // Fetch user-created pin from backend
          response = await api.get(`/api/pins/pin/${cleanId}`);
        } else {
          // Fetch Pexels image details
          response = await api.get(`/api/search/pin/${cleanId}`);
        }
        setImage(response.data);
        setLoading(false);

        // Fetch related images based on alt text keywords
        const keyword = response.data.alt?.split(' ').slice(0, 2).join(' ') || 'photography';
        const related = await api.get('/api/search/images', {
          params: { query: keyword, per_page: 12, page: 1 }
        });
        // Exclude the current pin
        setRelatedImages(related.data.photos.filter(p => String(p.id) !== String(cleanId)));

        // Check if pin is saved and liked (only if user is logged in)
        const token = localStorage.getItem('pixora_token');
        if (token) {
          // Check saved status
          try {
            const savedStatus = await checkPinSaved(cleanId);
            setIsSaved(savedStatus.isSaved);
          } catch (err) {
            console.error('Error checking saved status:', err);
          } finally {
            setCheckingSaved(false);
          }

          // Check liked status
          try {
            const likedStatus = await checkPinLiked(cleanId);
            setIsLiked(likedStatus.isLiked);
          } catch (err) {
            console.error('Error checking liked status:', err);
          }
        } else {
          setCheckingSaved(false);
        }

        // Get like count (public, no auth needed)
        try {
          const likesData = await getPinLikes(cleanId);
          setLikeCount(likesData.likeCount || 0);
        } catch (err) {
          console.error('Error fetching like count:', err);
        }
      } catch (err) {
        setError('Pin not found');
        setLoading(false);
        setCheckingSaved(false);
      }
    };

    fetchPinDetails();
    // Scroll to top on new pin
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [id]);

  const handleSavePin = async () => {
    const token = localStorage.getItem('pixora_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setSaving(true);
    const previousSavedState = isSaved;
    
    // Optimistic UI update
    setIsSaved(!isSaved);

    try {
      if (!isSaved) {
        // Save pin
        await savePin({
          imageId: String(image.id),
          imageUrl: image.src.large || image.src.large2x,
          thumbnailUrl: image.src.medium || image.src.large,
          alt: image.alt || 'Saved Pin',
          title: image.title || image.alt || '',
          description: image.description || '',
          link: image.url || '',
          width: image.width || 400,
          height: image.height || 600,
          photographer: image.photographer || '',
          tags: [],
          isUserCreated: image.id?.toString().startsWith('pin_') || false
        });
      } else {
        // Unsave pin
        await unsavePin(String(image.id));
      }
    } catch (err) {
      // Revert optimistic update on error
      setIsSaved(previousSavedState);
      console.error('Error saving/unsaving pin:', err);
      alert(err.response?.data?.error || 'Failed to save pin');
    } finally {
      setSaving(false);
    }
  };

  const handleLikePin = async () => {
    const token = localStorage.getItem('pixora_token');
    if (!token) {
      navigate('/login');
      return;
    }

    setLiking(true);
    const previousLikedState = isLiked;
    const previousLikeCount = likeCount;
    
    // Optimistic UI update
    setIsLiked(!isLiked);
    setLikeCount(prev => isLiked ? Math.max(0, prev - 1) : prev + 1);

    try {
      if (!isLiked) {
        // Like pin
        const response = await likePin(String(image.id));
        setLikeCount(response.likeCount);
      } else {
        // Unlike pin
        const response = await unlikePin(String(image.id));
        setLikeCount(response.likeCount);
      }
    } catch (err) {
      // Revert optimistic update on error
      setIsLiked(previousLikedState);
      setLikeCount(previousLikeCount);
      console.error('Error liking/unliking pin:', err);
      
      // Don't show alert if already liked/unliked
      if (!err.response?.data?.alreadyLiked && !err.response?.data?.error?.includes('already')) {
        alert(err.response?.data?.error || 'Failed to like pin');
      }
    } finally {
      setLiking(false);
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    try {
      if (navigator.share) {
        await navigator.share({ title: image?.alt || 'Pin on Pixora', url });
      } else {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }
    } catch (err) {
      // user cancelled share
    }
  };

  const handleRelatedClick = (imageId) => {
    navigate(`/pin/${imageId}`);
  };

  // ── Skeleton Loading ──
  if (loading) {
    return (
      <div className="pin-detail-page">
        <div className="pin-skeleton-wrapper">
          <div className="pin-skeleton-image skeleton" />
          <div className="pin-skeleton-sidebar">
            <div className="pin-skeleton-actions skeleton" />
            <div className="pin-skeleton-photographer skeleton" />
            <div className="pin-skeleton-title skeleton" />
            <div className="pin-skeleton-body skeleton" />
            <div className="pin-skeleton-body short skeleton" />
          </div>
        </div>
      </div>
    );
  }

  if (error || !image) {
    return (
      <div className="pin-detail-page">
        <div className="pin-error">
          <span className="pin-error-icon">🔍</span>
          <h2>Pin not found</h2>
          <p>This pin may have been removed or doesn't exist.</p>
          <button onClick={() => navigate('/home')} className="btn-go-home">Go home</button>
        </div>
      </div>
    );
  }

  // Generate smart tags from alt text
  const smartTags = image.alt
    ? [...new Set(image.alt.split(' ').filter(w => w.length > 3).slice(0, 6))]
    : ['Photography', 'Inspiration', 'Art'];

  return (
    <div className="pin-detail-page">
      {/* ── Main Card ── */}
      <div className="pin-card">

        {/* Left — Image */}
        <div className="pin-image-col">
          <div className="pin-image-wrapper">
            {/* Floating back button on image */}
            <button className="pin-back-btn" onClick={() => navigate(-1)} aria-label="Go back">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 12H5M12 19l-7-7 7-7"/>
              </svg>
            </button>

            <img
              src={image.src.large2x || image.src.large}
              alt={image.alt || 'Pin image'}
              className="pin-image"
            />
          </div>
        </div>

        {/* Right — Info Sidebar */}
        <div className="pin-sidebar">

          {/* Top action row */}
          <div className="pin-top-actions">
            <div className="pin-top-left">
              {/* Like button */}
              <button 
                className={`pin-icon-btn pin-like-btn ${isLiked ? 'liked' : ''}`}
                onClick={handleLikePin}
                disabled={liking}
                title={isLiked ? 'Unlike' : 'Like'}
              >
                <svg 
                  width="20" 
                  height="20" 
                  viewBox="0 0 24 24" 
                  fill={isLiked ? 'currentColor' : 'none'}
                  stroke="currentColor" 
                  strokeWidth="2" 
                  strokeLinecap="round" 
                  strokeLinejoin="round"
                  className="heart-icon"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
                </svg>
                {likeCount > 0 && <span className="like-count">{likeCount}</span>}
              </button>
              
              <button className="pin-icon-btn" onClick={handleShare} title={copied ? 'Copied!' : 'Share'}>
                {copied ? (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"/>
                  </svg>
                ) : (
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/>
                    <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"/>
                    <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"/>
                  </svg>
                )}
              </button>
              <a
                href={image.url}
                target="_blank"
                rel="noopener noreferrer"
                className="pin-icon-btn"
                title="View on Pexels"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                  <polyline points="15 3 21 3 21 9"/>
                  <line x1="10" y1="14" x2="21" y2="3"/>
                </svg>
              </a>
            </div>

            <button
              className={`pin-save-btn ${isSaved ? 'saved' : ''}`}
              onClick={handleSavePin}
              disabled={saving || checkingSaved}
            >
              {checkingSaved ? '...' : (isSaved ? 'Saved' : 'Save')}
            </button>
          </div>

          {/* Photographer */}
          <div className="pin-photographer">
            <div className="pin-photographer-avatar">
              {image.photographer?.charAt(0).toUpperCase() || 'P'}
            </div>
            <div className="pin-photographer-info">
              <a
                href={image.photographer_url}
                target="_blank"
                rel="noopener noreferrer"
                className="pin-photographer-name"
              >
                {image.photographer}
              </a>
              <span className="pin-photographer-sub">on Pexels</span>
            </div>
            <a
              href={image.photographer_url}
              target="_blank"
              rel="noopener noreferrer"
              className="pin-follow-btn"
            >
              Follow
            </a>
          </div>

          {/* Title */}
          {image.alt && (
            <h1 className="pin-title">{image.alt}</h1>
          )}

          {/* Image meta */}
          <div className="pin-meta">
            <span className="pin-meta-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
              {image.width} × {image.height}
            </span>
            <span className="pin-meta-dot">·</span>
            <span className="pin-meta-item">Free to use</span>
          </div>

          {/* Tags derived from alt text */}
          <div className="pin-tags">
            {smartTags.map((tag, i) => (
              <button
                key={i}
                className="pin-tag"
                onClick={() => navigate(`/search?q=${encodeURIComponent(tag)}`)}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* Source */}
          <div className="pin-source">
            <a
              href={image.url}
              target="_blank"
              rel="noopener noreferrer"
              className="pin-source-link"
            >
              <div className="pin-source-icon">P</div>
              <div className="pin-source-text">
                <span className="pin-source-domain">pexels.com</span>
                <span className="pin-source-label">View original</span>
              </div>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"/>
              </svg>
            </a>
          </div>

        </div>
      </div>

      {/* ── Related Pins ── */}
      {relatedImages.length > 0 && (
        <div className="pin-related">
          <div className="pin-related-header">
            <div className="pin-related-line" />
            <h2 className="pin-related-title">More like this</h2>
            <div className="pin-related-line" />
          </div>
          <ResponsiveMasonry
            columnsCountBreakPoints={{ 350: 2, 600: 3, 900: 4, 1200: 5 }}
          >
            <Masonry gutter="12px">
              {relatedImages.map((img) => (
                <ImageCard
                  key={img.id}
                  image={img}
                  onClick={handleRelatedClick}
                />
              ))}
            </Masonry>
          </ResponsiveMasonry>
        </div>
      )}
    </div>
  );
}

export default PinDetailPage;