import React, { useState, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import './CreatePinPage.css';

const UploadIcon = () => (
  <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="16 16 12 12 8 16"/>
    <line x1="12" y1="12" x2="12" y2="21"/>
    <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3"/>
  </svg>
);

const CloseIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="18" y1="6" x2="6" y2="18"/>
    <line x1="6" y1="6" x2="18" y2="18"/>
  </svg>
);

const LinkIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/>
    <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/>
  </svg>
);

function CreatePinPage() {
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Image state
  const [dragOver, setDragOver]   = useState(false);
  const [preview, setPreview]     = useState(null);   // local blob URL for preview
  const [file, setFile]           = useState(null);   // actual File object
  const [imageUrl, setImageUrl]   = useState('');     // URL-based upload alternative

  // Form state
  const [title, setTitle]         = useState('');
  const [description, setDescription] = useState('');
  const [link, setLink]           = useState('');
  const [tags, setTags]           = useState([]);
  const [tagInput, setTagInput]   = useState('');

  // Upload state
  const [publishing, setPublishing] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError]         = useState('');
  const [success, setSuccess]     = useState(false);

  // ── File handling ──
  const handleFile = useCallback((f) => {
    if (!f) return;

    const allowed = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowed.includes(f.type)) {
      setError('Please upload a JPG, PNG, GIF, or WebP image.');
      return;
    }
    if (f.size > 20 * 1024 * 1024) {
      setError('File must be under 20MB.');
      return;
    }

    setError('');
    setFile(f);
    setImageUrl('');
    // Create local preview
    const url = URL.createObjectURL(f);
    setPreview(url);
  }, []);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    handleFile(e.dataTransfer.files[0]);
  };

  const handleRemoveImage = () => {
    if (preview && file) URL.revokeObjectURL(preview); // free memory
    setPreview(null);
    setFile(null);
    setImageUrl('');
  };

  // ── Tag handling ──
  const addTag = (raw) => {
    const tag = raw.trim().toLowerCase().replace(/,/g, '');
    if (tag && !tags.includes(tag) && tags.length < 10) {
      setTags(prev => [...prev, tag]);
    }
  };

  const handleTagKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag(tagInput);
      setTagInput('');
    }
  };

  const removeTag = (tag) => setTags(prev => prev.filter(t => t !== tag));

  // ── URL-based image preview ──
  const handleUrlBlur = (e) => {
    const val = e.target.value.trim();
    if (!val) return;
    setImageUrl(val);
    setPreview(val);
    setFile(null);
    setError('');
  };

  // ── Publish ──
  const handlePublish = async () => {
    if (!preview) { setError('Please add an image.'); return; }
    if (!title.trim()) { setError('Please add a title.'); return; }

    setPublishing(true);
    setError('');
    setUploadProgress(0);

    try {
      const formData = new FormData();

      if (file) {
        // File upload
        formData.append('image', file);
      } else if (imageUrl) {
        // URL upload
        formData.append('imageUrl', imageUrl);
      }

      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('link', link.trim());
      formData.append('tags', JSON.stringify(tags));

      const res = await api.post('/api/pins/create', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          const pct = Math.round((e.loaded / e.total) * 100);
          setUploadProgress(pct);
        }
      });

      setSuccess(true);

      // Navigate to the newly created pin after a short delay
      setTimeout(() => {
        navigate(`/pin/${encodeURIComponent(res.data.pin.id)}`);
      }, 800);

    } catch (err) {
      setError(err.response?.data?.error || 'Failed to publish pin. Please try again.');
      setPublishing(false);
      setUploadProgress(0);
    }
  };

  return (
    <div className="create-page">

      {/* ── Top Bar ── */}
      <div className="create-topbar">
        <button className="create-topbar-back" onClick={() => navigate(-1)} disabled={publishing}>
          <CloseIcon />
        </button>
        <h1 className="create-topbar-title">Create Pin</h1>
        <button
          className="create-publish-btn"
          onClick={handlePublish}
          disabled={publishing || (!preview) || !title.trim()}
        >
          {publishing
            ? uploadProgress < 100
              ? `Uploading ${uploadProgress}%`
              : 'Saving...'
            : success
            ? '✓ Published!'
            : 'Publish'}
        </button>
      </div>

      {/* ── Progress bar ── */}
      {publishing && (
        <div className="create-progress-bar">
          <div className="create-progress-fill" style={{ width: `${uploadProgress}%` }} />
        </div>
      )}

      {/* ── Main ── */}
      <div className="create-main">

        {/* Left — Image */}
        <div className="create-left">
          {preview ? (
            <div className="create-preview-wrapper">
              <img src={preview} alt="Preview" className="create-preview-img" />
              {!publishing && (
                <button className="create-preview-remove" onClick={handleRemoveImage} title="Remove">
                  <CloseIcon />
                </button>
              )}
              {file && (
                <div className="create-preview-badge">
                  {(file.size / (1024 * 1024)).toFixed(1)} MB
                </div>
              )}
            </div>
          ) : (
            <>
              <div
                className={`create-dropzone ${dragOver ? 'drag-over' : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
              >
                <div className="create-dropzone-inner">
                  <div className="create-dropzone-icon">
                    <UploadIcon />
                  </div>
                  <p className="create-dropzone-title">Choose a file or drag and drop it here</p>
                  <p className="create-dropzone-sub">High quality JPG, PNG, or WebP · Max 20 MB</p>
                  <button
                    className="create-dropzone-btn"
                    onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                  >
                    Browse files
                  </button>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/jpg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  onChange={(e) => handleFile(e.target.files[0])}
                />
              </div>

              <div className="create-url-divider">
                <span>or</span>
              </div>

              <div className="create-url-section">
                <label className="create-label">
                  <LinkIcon /> Save from URL
                </label>
                <input
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  className="create-input"
                  defaultValue={imageUrl}
                  onBlur={handleUrlBlur}
                />
              </div>
            </>
          )}
        </div>

        {/* Right — Form */}
        <div className="create-right">

          {error && <div className="create-error">{error}</div>}

          {/* Title */}
          <div className="create-field">
            <label className="create-label">Title <span className="create-required">*</span></label>
            <input
              type="text"
              className={`create-input large ${!title.trim() && error ? 'input-error' : ''}`}
              placeholder="Add your title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
              disabled={publishing}
            />
            <span className="create-char-count">{title.length}/100</span>
          </div>

          {/* Description */}
          <div className="create-field">
            <label className="create-label">Description</label>
            <textarea
              className="create-input"
              placeholder="Tell people what your pin is about"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={4}
              maxLength={500}
              disabled={publishing}
            />
            <span className="create-char-count">{description.length}/500</span>
          </div>

          {/* Link */}
          <div className="create-field">
            <label className="create-label"><LinkIcon /> Destination link</label>
            <input
              type="url"
              className="create-input"
              placeholder="https://yourwebsite.com"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              disabled={publishing}
            />
          </div>

          {/* Tags */}
          <div className="create-field">
            <label className="create-label">
              Tags
              <span className="create-field-hint-inline"> — press Enter to add</span>
            </label>
            <div className="create-tags-wrapper" onClick={() => document.getElementById('tag-input')?.focus()}>
              {tags.map((tag, i) => (
                <span key={i} className="create-tag">
                  {tag}
                  <button className="create-tag-remove" onClick={() => removeTag(tag)} disabled={publishing}>×</button>
                </span>
              ))}
              <input
                id="tag-input"
                type="text"
                className="create-tag-input"
                placeholder={tags.length === 0 ? 'Add tags...' : ''}
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={() => { if (tagInput.trim()) { addTag(tagInput); setTagInput(''); } }}
                disabled={tags.length >= 10 || publishing}
              />
            </div>
            <span className="create-field-hint">{tags.length}/10 tags</span>
          </div>

          {/* Tips */}
          <div className="create-tips">
            <p className="create-tips-title">💡 Tips for great pins</p>
            <ul className="create-tips-list">
              <li>Vertical images (2:3 ratio) perform best in the feed</li>
              <li>Write a clear, specific title so people can find your pin</li>
              <li>Add a destination link if the pin references external content</li>
              <li>Tags help people discover your pin through search</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}

export default CreatePinPage;