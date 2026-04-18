'use client';

import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function Providers({ children }) {
    return (
        <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || 'mock-id-requires-cloud-console'}>
            <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
                {children}
                <Toaster
                    position="bottom-right"
                    toastOptions={{
                        style: {
                            background: 'var(--bg-card)',
                            color: 'var(--text-main)',
                            border: '1px solid var(--border)',
                        },
                        success: {
                            iconTheme: {
                                primary: 'var(--success)',
                                secondary: 'white',
                            },
                        },
                        error: {
                            iconTheme: {
                                primary: 'var(--danger)',
                                secondary: 'white',
                            },
                        },
                    }}
                />
            </ThemeProvider>
        </GoogleOAuthProvider>
    );
}
