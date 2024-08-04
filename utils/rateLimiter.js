const { rateLimit } = require("express-rate-limit");
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  message: {
    message: "Too many requests, please try 5 min later",
  },
});
const globalRateLimiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 100,
  legacyHeaders: false,
  standardHeaders: "draft-7",
  message: {
    message: "Too many requests, please try again later",
  },
});

module.exports = { limiter, globalRateLimiter };
