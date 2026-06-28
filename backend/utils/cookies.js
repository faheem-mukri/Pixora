// Centralized cookie option helpers.
//
// Single source of truth so that the options used to SET a cookie always match
// the options used to CLEAR it, and so the Secure/SameSite invariant is enforced:
//   when SameSite=None, Secure MUST be true or browsers reject the cookie.
//
// Deployment configuration:
//   COOKIE_CROSS_SITE=true  -> frontend and backend are on different sites
//                              (e.g. Vercel + Render). Uses SameSite=None; Secure.
//   COOKIE_CROSS_SITE unset  -> same-site / shared-parent-domain deployment.
//                              Uses SameSite=Lax (first-party, most reliable).
//   COOKIE_DOMAIN=.example.com -> share the cookie across subdomains
//                                 (app.example.com + api.example.com).

const crossSite = process.env.COOKIE_CROSS_SITE === 'true';
const cookieDomain = process.env.COOKIE_DOMAIN || undefined;

const ACCESS_MAX_AGE = 15 * 60 * 1000; // 15 minutes
const REFRESH_MAX_AGE = 7 * 24 * 60 * 60 * 1000; // 7 days

// Base options shared by both set and clear operations.
function baseCookieOptions() {
  return {
    httpOnly: true,
    // Secure MUST be true whenever sameSite is 'none'. In same-site mode we
    // still require HTTPS in production.
    secure: crossSite ? true : process.env.NODE_ENV === 'production',
    sameSite: crossSite ? 'none' : 'lax',
    domain: cookieDomain,
    path: '/',
  };
}

function accessCookieOptions() {
  return { ...baseCookieOptions(), maxAge: ACCESS_MAX_AGE };
}

function refreshCookieOptions() {
  return { ...baseCookieOptions(), maxAge: REFRESH_MAX_AGE };
}

// clearCookie must use the same attributes the cookie was set with, minus maxAge.
function clearCookieOptions() {
  const opts = baseCookieOptions();
  delete opts.maxAge;
  return opts;
}

module.exports = {
  accessCookieOptions,
  refreshCookieOptions,
  clearCookieOptions,
  ACCESS_MAX_AGE,
  REFRESH_MAX_AGE,
};
