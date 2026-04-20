/**
 * Frontend validation utilities
 */

export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email is required' };
  }
  
  const trimmed = email.trim();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(trimmed)) {
    return { valid: false, message: 'Please provide a valid email address' };
  }
  
  return { valid: true, value: trimmed.toLowerCase() };
};

export const validatePassword = (password) => {
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

export const validateUsername = (username) => {
  if (!username || typeof username !== 'string') {
    return { valid: false, message: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, message: 'Username must be at least 3 characters long' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, message: 'Username must be less than 30 characters' };
  }
  
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmed)) {
    return { valid: false, message: 'Username can only contain letters, numbers, underscores, and hyphens' };
  }
  
  return { valid: true, value: trimmed.toLowerCase() };
};

export const validateDisplayName = (displayName) => {
  if (!displayName) {
    return { valid: true, value: '' };
  }
  
  if (typeof displayName !== 'string') {
    return { valid: false, message: 'Display name must be text' };
  }
  
  const trimmed = displayName.trim();
  
  if (trimmed.length > 50) {
    return { valid: false, message: 'Display name must be less than 50 characters' };
  }
  
  return { valid: true, value: trimmed };
};

export const validateConfirmPassword = (password, confirmPassword) => {
  if (password !== confirmPassword) {
    return { valid: false, message: 'Passwords do not match' };
  }
  
  return { valid: true };
};

export const validateSearchQuery = (query) => {
  if (!query || typeof query !== 'string') {
    return { valid: false, message: 'Search query is required' };
  }
  
  const trimmed = query.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, message: 'Search query cannot be empty' };
  }
  
  if (trimmed.length > 100) {
    return { valid: false, message: 'Search query is too long' };
  }
  
  return { valid: true, value: trimmed };
};

export const validateBio = (bio) => {
  if (!bio) {
    return { valid: true, value: '' };
  }
  
  if (typeof bio !== 'string') {
    return { valid: false, message: 'Bio must be text' };
  }
  
  const trimmed = bio.trim();
  
  if (trimmed.length > 200) {
    return { valid: false, message: 'Bio must be less than 200 characters' };
  }
  
  return { valid: true, value: trimmed };
};

export default {
  validateEmail,
  validatePassword,
  validateUsername,
  validateDisplayName,
  validateConfirmPassword,
  validateSearchQuery,
  validateBio
};
