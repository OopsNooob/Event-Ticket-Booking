import { clerkMiddleware } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// ============================================================================
// RATE LIMITING IMPLEMENTATION (Backlog New_02)
// ============================================================================
// Simple in-memory rate limiter to prevent spam and bot attacks
// For production, consider using Redis or @upstash/ratelimit
// ============================================================================

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

// Store for tracking requests per IP/token
const rateLimitStore = new Map<string, RateLimitEntry>();

// Rate limit configuration
const RATE_LIMIT_CONFIG = {
  windowMs: 60 * 1000, // 1 minute window
  maxRequests: 100, // 100 requests per minute per IP
  apiMaxRequests: 30, // Stricter limit for API routes: 30 req/min
};

/**
 * Get client IP address from request
 */
function getClientIP(req: NextRequest): string {
  const forwarded = req.headers.get('x-forwarded-for');
  return forwarded ? forwarded.split(',')[0].trim() : 'unknown';
}

/**
 * Check rate limit for a given identifier (IP or token)
 * Returns true if request is allowed, false if rate limit exceeded
 */
function checkRateLimit(identifier: string, limit: number): boolean {
  const now = Date.now();
  const entry = rateLimitStore.get(identifier);

  if (!entry) {
    // New identifier, create entry
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return true;
  }

  if (now > entry.resetTime) {
    // Window expired, reset counter
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_CONFIG.windowMs,
    });
    return true;
  }

  // Still in the same window
  if (entry.count < limit) {
    entry.count++;
    return true;
  }

  // Rate limit exceeded
  return false;
}

/**
 * Clean up old entries from rate limit store (every 5 minutes)
 */
function cleanupRateLimitStore() {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime + RATE_LIMIT_CONFIG.windowMs) {
      rateLimitStore.delete(key);
    }
  }
}

// Cleanup every 5 minutes
if (typeof globalThis !== 'undefined' && !('rateLimitCleanupInterval' in globalThis)) {
  setInterval(cleanupRateLimitStore, 5 * 60 * 1000);
}

export default clerkMiddleware(async (auth, req) => {
  // Get client identifier (IP address as fallback)
  const clientIP = getClientIP(req);

  // Determine rate limit based on route type
  const isApiRoute = req.nextUrl.pathname.startsWith('/api');
  const limit = isApiRoute 
    ? RATE_LIMIT_CONFIG.apiMaxRequests 
    : RATE_LIMIT_CONFIG.maxRequests;

  // Use IP as identifier for rate limiting
  // (Clerk auth is handled by clerkMiddleware separately)
  const identifier = clientIP;

  // Check rate limit
  if (!checkRateLimit(identifier, limit)) {
    // Rate limit exceeded - return 429 Too Many Requests
    return NextResponse.json(
      {
        error: 'Too many requests',
        message: `Rate limit exceeded. Maximum ${limit} requests per minute.`,
        retryAfter: RATE_LIMIT_CONFIG.windowMs / 1000,
      },
      {
        status: 429,
        headers: {
          'Retry-After': String(Math.ceil(RATE_LIMIT_CONFIG.windowMs / 1000)),
          'X-RateLimit-Limit': String(limit),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': String(Date.now() + RATE_LIMIT_CONFIG.windowMs),
        },
      }
    );
  }

  // Add rate limit headers to response
  const response = NextResponse.next();
  response.headers.set('X-RateLimit-Limit', String(limit));
  response.headers.set('X-RateLimit-Remaining', String(limit - (rateLimitStore.get(identifier)?.count || 0)));
  response.headers.set('X-RateLimit-Reset', String(Date.now() + RATE_LIMIT_CONFIG.windowMs));

  return response;
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};