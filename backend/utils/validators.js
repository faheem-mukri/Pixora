const validator = require('validator');

const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  const trimmed = email.trim();
  if (!validator.isEmail(trimmed)) {
    return { valid: false, message: 'Please provide a valid email address' };
  }
  return { valid: true, value: trimmed.toLowerCase() };
};

const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Password is required' };
  }
  if (password.length < 8) {
    return { valid: false, message: 'Password must be at least 8 characters long' };
  }
  if (!/[a-z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one lowercase letter' };
  }
  if (!/[A-Z]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one uppercase letter' };
  }
  if (!/[0-9]/.test(password)) {
    return { valid: false, message: 'Password must contain at least one number' };
  }
  return { valid: true, value: password };
};

const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' };
  }
  const trimmed = username.trim();
  if (trimmed.length < 3 || trimmed.length > 30) {
    return { valid: false, message: 'Username must be 3-30 characters' };
  }
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  return { valid: true, value: trimmed.toLowerCase() };
};

const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { valid: false, message: 'Search query is required' };
  }
  const trimmed = query.trim();
  if (trimmed.length === 0 || trimmed.length > 100) {
    return { valid: false, message: 'Search query must be 1-100 characters' };
  }
  return { valid: true, value: validator.escape(trimmed) };
};

const validatePagination = (page, limit) => {
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 20;
  
  if (p < 1) {
    return { valid: false, error: 'Page must be >= 1' };
  }
  if (l < 1 || l > 100) {
    return { valid: false, error: 'Limit must be between 1 and 100' };
  }
  
  return { valid: true, page: p, limit: l };
};

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateSearchQuery,
  validatePagination
};
