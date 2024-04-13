const {rateLimit} = require('express-rate-limit')

const limiter = rateLimit({
	windowMs: 60 * 1000, // 1 minutes
	limit: 10, // Limit each IP to 10 requests per `window` (here, per 1 minute).
	standardHeaders: 'draft-7', // draft-6: `RateLimit-*` headers; draft-7: combined `RateLimit` header
	legacyHeaders: false, // Disable the `X-RateLimit-*` headers.
    message: 'Too many requests, please try again later.'
	// store: ... , // Redis, Memcached, etc. See below.
})

module.exports = limiter;