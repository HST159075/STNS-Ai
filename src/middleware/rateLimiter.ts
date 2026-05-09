import rateLimit from 'express-rate-limit';

// Global rate limiter applied to all requests
export const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200, // Limit each IP to 200 requests per `window` (here, per 15 minutes)
  message: {
    success: false,
    error: 'Too many requests from this IP, please try again after 15 minutes.',
  },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Stricter rate limiter for authentication routes (login, register)
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 20, // Limit each IP to 20 authentication requests per hour
  message: {
    success: false,
    error: 'Too many login attempts from this IP, please try again after an hour.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Rate limiter for AI routes (expensive operations)
export const aiLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour window
  max: 50, // Limit each IP to 50 AI generation requests per hour
  message: {
    success: false,
    error: 'AI request limit reached. Please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});
