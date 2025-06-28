
'use client' // Error components must be Client Components

import type { Metadata } from 'next';
import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

// No direct metadata export from error.tsx itself.
// Metadata would typically be in layout.tsx.

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error("GlobalError caught:", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <head>
        <title>Error - BetNexo</title>
        {/* You can include minimal styling or links here if necessary */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap" rel="stylesheet" />
        <style>{`
          body {
            font-family: 'Inter', sans-serif;
            background-color: #1e293b; /* Dark Blue */
            color: #e2e8f0; /* Light Slate */
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            margin: 0;
            padding: 20px;
            text-align: center;
          }
          .error-container {
            background-color: #293548; /* Darker Card */
            padding: 30px;
            border-radius: 8px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
          }
          h2 {
            font-family: 'Poppins', sans-serif;
            color: #4287f5; /* Saturated Blue */
            font-size: 2em;
            margin-bottom: 15px;
          }
          p {
            margin-bottom: 20px;
            font-size: 1.1em;
            line-height: 1.6;
          }
          pre {
            background-color: #1e293b;
            border: 1px solid #3b4a61; /* Subtle Border */
            padding: 15px;
            border-radius: 4px;
            text-align: left;
            white-space: pre-wrap;
            word-break: break-all;
            max-height: 200px;
            overflow-y: auto;
            font-size: 0.9em;
          }
          .button-retry {
            background-color: #ffc857; /* Yellow Accent */
            color: #1e293b; /* Dark Blue Text on Accent */
            border: none;
            padding: 10px 20px;
            font-size: 1em;
            border-radius: 5px;
            cursor: pointer;
            transition: background-color 0.3s ease;
          }
          .button-retry:hover {
            background-color: #e0b04c;
          }
        `}</style>
      </head>
      <body className="font-body antialiased">
        <div className="error-container">
          <h2>Application Error</h2>
          <p>We're sorry, something went wrong. Our team has been notified.</p>
          {error?.message && (
            <>
              <p>Error details:</p>
              <pre>{error.message}</pre>
            </>
          )}
          {error?.digest && (
             <p style={{fontSize: '0.8em', marginTop: '10px', color: '#aaa'}}>Digest: {error.digest}</p>
          )}
          <button className="button-retry" onClick={() => reset()}>
            Try again
          </button>
        </div>
      </body>
    </html>
  )
}
