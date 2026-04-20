const fs = require('fs');
const path = require('path');

// Create utils directory
const utilsDir = path.join(__dirname, 'utils');
if (!fs.existsSync(utilsDir)) {
  fs.mkdirSync(utilsDir, { recursive: true });
  console.log(`✓ Created directory: ${utilsDir}`);
}

// Create validators.js
const validatorsFile = path.join(utilsDir, 'validators.js');
const validatorsContent = `const validator = require('validator');

/**
 * Validate and sanitize email address
 * @param {string} email - Email address to validate
 * @returns {object} { isValid: boolean, error: string|null, sanitized: string|null } */
function validateEmail(email) {
  if (!email || typeof email !== 'string') {
    return { isValid: false, error: 'Email is required and must be a string', sanitized: null };
  }

  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return { isValid: false, error: 'Email cannot be empty', sanitized: null };
  }

  if (trimmedEmail.length > 255) {
    return { isValid: false, error: 'Email cannot exceed 255 characters', sanitized: null };
  }

  if (!validator.isEmail(trimmedEmail)) {
    return { isValid: false, error: 'Invalid email format', sanitized: null };
  }

  const sanitizedEmail = validator.normalizeEmail(trimmedEmail);
  return { isValid: true, error: null, sanitized: sanitizedEmail };
}

/**
 * Validate password strength
 * @param {string} password - Password to validate
 * @returns {object} { isValid: boolean, error: string|null, strength: string }
 */
function validatePassword(password) {
  if (!password || typeof password !== 'string') {
    return { isValid: false, error: 'Password is required and must be a string', strength: 'none' };
  }

  const trimmedPassword = password.trim();

  if (trimmedPassword.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long', strength: 'weak' };
  }

  if (trimmedPassword.length > 128) {
    return { isValid: false, error: 'Password cannot exceed 128 characters', strength: 'none' };
  }

  // Check for at least one uppercase letter
  if (!/[A-Z]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter', strength: 'weak' };
  }

  // Check for at least one lowercase letter
  if (!/[a-z]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter', strength: 'weak' };
  }

  // Check for at least one digit
  if (!/\\d/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one number', strength: 'weak' };
  }

  // Check for at least one special character
  if (!/[!@#$%^&*()_+\\-=\\[\\]{};':"\\\\|,.<>\\/?]/.test(trimmedPassword)) {
    return { isValid: false, error: 'Password must contain at least one special character', strength: 'medium' };
  }

  const strength = trimmedPassword.length >= 12 ? 'strong' : 'medium';
  return { isValid: true, error: null, strength };
}

/**
 * Validate username
 * @param {string} username - Username to validate
 * @returns {object} { isValid: boolean, error: string|null, sanitized: string|null }
 */
function validateUsername(username) {
  if (!username || typeof username !== 'string') {
    return { isValid: false, error: 'Username is required and must be a string', sanitized: null };
  }

  const trimmedUsername = username.trim();

  if (trimmedUsername.length < 3) {
    return { isValid: false, error: 'Username must be at least 3 characters long', sanitized: null };
  }

  if (trimmedUsername.length > 30) {
    return { isValid: false, error: 'Username cannot exceed 30 characters', sanitized: null };
  }

  // Username can contain letters, numbers, underscores, and hyphens
  if (!/^[a-zA-Z0-9_-]+$/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username can only contain letters, numbers, underscores, and hyphens', sanitized: null };
  }

  // Cannot start or end with hyphen or underscore
  if (/^[-_]|[-_]$/.test(trimmedUsername)) {
    return { isValid: false, error: 'Username cannot start or end with a hyphen or underscore', sanitized: null };
  }

  const sanitizedUsername = validator.escape(trimmedUsername);
  return { isValid: true, error: null, sanitized: sanitizedUsername };
}

/**
 * Validate display name
 * @param {string} displayName - Display name to validate
 * @returns {object} { isValid: boolean, error: string|null, sanitized: string|null }
 */
function validateDisplayName(displayName) {
  if (!displayName || typeof displayName !== 'string') {
    return { isValid: false, error: 'Display name is required and must be a string', sanitized: null };
  }

  const trimmedName = displayName.trim();

  if (trimmedName.length === 0) {
    return { isValid: false, error: 'Display name cannot be empty', sanitized: null };
  }

  if (trimmedName.length < 2) {
    return { isValid: false, error: 'Display name must be at least 2 characters long', sanitized: null };
  }

  if (trimmedName.length > 50) {
    return { isValid: false, error: 'Display name cannot exceed 50 characters', sanitized: null };
  }

  // Allow letters, numbers, spaces, and common punctuation
  if (!/^[a-zA-Z0-9\\s\\-'.]+$/.test(trimmedName)) {
    return { isValid: false, error: 'Display name contains invalid characters', sanitized: null };
  }

  const sanitizedName = validator.escape(trimmedName);
  return { isValid: true, error: null, sanitized: sanitizedName };
}

/**
 * Validate search query
 * @param {string} query - Search query to validate
 * @returns {object} { isValid: boolean, error: string|null, sanitized: string|null }
 */
function validateSearchQuery(query) {
  if (!query || typeof query !== 'string') {
    return { isValid: false, error: 'Search query is required and must be a string', sanitized: null };
  }

  const trimmedQuery = query.trim();

  if (trimmedQuery.length === 0) {
    return { isValid: false, error: 'Search query cannot be empty', sanitized: null };
  }

  if (trimmedQuery.length < 2) {
    return { isValid: false, error: 'Search query must be at least 2 characters long', sanitized: null };
  }

  if (trimmedQuery.length > 100) {
    return { isValid: false, error: 'Search query cannot exceed 100 characters', sanitized: null };
  }

  const sanitizedQuery = validator.escape(trimmedQuery);
  return { isValid: true, error: null, sanitized: sanitizedQuery };
}

/**
 * Validate pagination parameters
 * @param {number} page - Page number
 * @param {number} limit - Items per page
 * @returns {object} { isValid: boolean, error: string|null, page: number, limit: number }
 */
function validatePagination(page, limit) {
  const defaultPage = 1;
  const defaultLimit = 10;
  const minLimit = 1;
  const maxLimit = 100;

  // Validate page
  let validPage = defaultPage;
  if (page !== undefined && page !== null) {
    const parsedPage = parseInt(page, 10);
    if (isNaN(parsedPage) || parsedPage < 1) {
      return { isValid: false, error: 'Page must be a positive integer', page: defaultPage, limit: defaultLimit };
    }
    validPage = parsedPage;
  }

  // Validate limit
  let validLimit = defaultLimit;
  if (limit !== undefined && limit !== null) {
    const parsedLimit = parseInt(limit, 10);
    if (isNaN(parsedLimit) || parsedLimit < minLimit || parsedLimit > maxLimit) {
      return { isValid: false, error: \`Limit must be between \${minLimit} and \${maxLimit}\`, page: validPage, limit: defaultLimit };
    }
    validLimit = parsedLimit;
  }

  return { isValid: true, error: null, page: validPage, limit: validLimit };
}

/**
 * Validate bio/description
 * @param {string} bio - Bio text to validate
 * @returns {object} { isValid: boolean, error: string|null, sanitized: string|null }
 */
function validateBio(bio) {
  // Bio is optional, so null/undefined is valid
  if (bio === null || bio === undefined) {
    return { isValid: true, error: null, sanitized: null };
  }

  if (typeof bio !== 'string') {
    return { isValid: false, error: 'Bio must be a string', sanitized: null };
  }

  const trimmedBio = bio.trim();

  // Empty bio is valid (user can choose not to have one)
  if (trimmedBio.length === 0) {
    return { isValid: true, error: null, sanitized: '' };
  }

  if (trimmedBio.length > 500) {
    return { isValid: false, error: 'Bio cannot exceed 500 characters', sanitized: null };
  }

  // Allow letters, numbers, spaces, and common punctuation
  if (!/^[a-zA-Z0-9\\s\\-'.!,?&@()]+$/.test(trimmedBio)) {
    return { isValid: false, error: 'Bio contains invalid characters', sanitized: null };
  }

  const sanitizedBio = validator.escape(trimmedBio);
  return { isValid: true, error: null, sanitized: sanitizedBio };
}

module.exports = {
  validateEmail,
  validatePassword,
  validateUsername,
  validateDisplayName,
  validateSearchQuery,
  validatePagination,
  validateBio,
};
`;

fs.writeFileSync(validatorsFile, validatorsContent);
console.log(`✓ Created file: ${validatorsFile}`);
console.log('\nSetup complete! Now install validator package with: npm install validator');
