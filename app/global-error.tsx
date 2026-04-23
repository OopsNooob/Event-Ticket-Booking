'use client';

import { useEffect, useState } from 'react';

export default function GlobalError({ error, reset }: { error: Error; reset: () => void }) {
  const [reported, setReported] = useState(false);
  const [errorId, setErrorId] = useState<string>('');

  useEffect(() => {
    // Generate unique error ID for tracking
    const id = `ERR-${Date.now()}-${Math.random().toString(36).substring(7)}`;
    setErrorId(id);

    // Prepare error details with 100% stack trace (ASR requirement)
    const errorDetails = {
      id,
      message: error.message,
      stack: error.stack,
      name: error.name,
      timestamp: new Date().toISOString(),
      url: typeof window !== 'undefined' ? window.location.href : 'unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'unknown',
    };

    console.error('🚨 Global Error Caught:', errorDetails);

    // Report to backend API (non-blocking)
    fetch('/api/notify-devs', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(errorDetails),
    })
      .then(() => setReported(true))
      .catch((err) => {
        console.error('Failed to report error:', err);
        // Fallback: attempt to send to backup service
        navigator.sendBeacon('/api/notify-devs', JSON.stringify(errorDetails));
      });
  }, [error]);

  return (
    <html>
      <body style={{ fontFamily: 'system-ui, -apple-system, sans-serif', margin: 0, padding: 0 }}>
        <div
          style={{
            minHeight: '100vh',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '20px',
          }}
        >
          {/* Error Alert Container */}
          <div
            style={{
              background: 'rgba(255, 255, 255, 0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '12px',
              padding: '40px',
              maxWidth: '500px',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.2)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            }}
          >
            {/* Error Icon */}
            <div style={{ fontSize: '64px', marginBottom: '20px' }}>⚠️</div>

            {/* Main Message */}
            <h1 style={{ fontSize: '28px', margin: '0 0 12px 0', fontWeight: 600 }}>
              Oops! Something went wrong
            </h1>

            {/* Description */}
            <p style={{ fontSize: '16px', margin: '0 0 20px 0', opacity: 0.9 }}>
              We're sorry for the inconvenience. Our team has been notified and is working on a fix.
            </p>

            {/* Error ID */}
            <div
              style={{
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '12px',
                borderRadius: '8px',
                margin: '20px 0',
                fontSize: '13px',
                wordBreak: 'break-all',
                fontFamily: 'monospace',
                opacity: 0.8,
              }}
            >
              <strong>Error Reference:</strong> {errorId}
            </div>

            {/* Status Badge */}
            {reported && (
              <div
                style={{
                  display: 'inline-block',
                  background: '#4ade80',
                  color: '#166534',
                  padding: '8px 16px',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: 600,
                  margin: '12px 0 20px 0',
                }}
              >
                ✓ Error reported to development team
              </div>
            )}

            {/* Debug Info (Development Only) */}
            {process.env.NODE_ENV === 'development' && (
              <details
                style={{
                  marginTop: '20px',
                  textAlign: 'left',
                  fontSize: '12px',
                  opacity: 0.8,
                  cursor: 'pointer',
                }}
              >
                <summary style={{ cursor: 'pointer', fontWeight: 600, marginBottom: '10px' }}>
                  📋 Stack Trace (Dev Only)
                </summary>
                <pre
                  style={{
                    background: 'rgba(0, 0, 0, 0.3)',
                    padding: '12px',
                    borderRadius: '6px',
                    overflow: 'auto',
                    maxHeight: '200px',
                    margin: '10px 0 0 0',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word',
                  }}
                >
                  {error.stack || 'No stack trace available'}
                </pre>
              </details>
            )}

            {/* Action Buttons */}
            <div style={{ marginTop: '30px', display: 'flex', gap: '12px', justifyContent: 'center' }}>
              <button
                onClick={() => reset()}
                style={{
                  padding: '10px 24px',
                  background: '#ffffff',
                  color: '#667eea',
                  border: 'none',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Try Again
              </button>

              <button
                onClick={() => (window.location.href = '/')}
                style={{
                  padding: '10px 24px',
                  background: 'rgba(255, 255, 255, 0.2)',
                  color: '#ffffff',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  borderRadius: '6px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontSize: '14px',
                  transition: 'opacity 0.2s',
                }}
                onMouseOver={(e) => (e.currentTarget.style.opacity = '0.8')}
                onMouseOut={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Go Home
              </button>
            </div>

            {/* Support Info */}
            <p style={{ fontSize: '12px', margin: '30px 0 0 0', opacity: 0.7 }}>
              If the issue persists, please contact support@eventbooking.com
            </p>
          </div>
        </div>
      </body>
    </html>
  );
}