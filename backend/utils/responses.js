const error = (statusCode, message, code, details = null) => ({
  error: message,
  code,
  ...(details && { details })
});

const success = (data, message = null) => ({
  success: true,
  data,
  ...(message && { message })
});

module.exports = { error, success };
