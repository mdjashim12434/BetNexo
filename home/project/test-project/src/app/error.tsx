'use client' // Error components must be Client Components

import { useEffect } from 'react';
import { Button } from '@/components/ui/button';

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
    <html>
      <body className="font-body antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center bg-background text-center">
            <div className="bg-card p-8 rounded-lg shadow-lg max-w-md w-full">
                <h2 className="text-2xl font-bold text-destructive mb-4">Application Error</h2>
                <p className="text-muted-foreground mb-6">
                    We're sorry, something went wrong. Our team has been notified.
                </p>
                
                {error?.digest && (
                    <p className="text-xs text-muted-foreground mb-4">Error Digest: {error.digest}</p>
                )}
                
                <Button onClick={() => reset()}>
                    Try again
                </Button>
            </div>
        </div>
      </body>
    </html>
  )
}
