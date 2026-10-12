'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';
import { GoogleOAuthProvider } from '@react-oauth/google';

export function Providers({ children }) {
    const router = useRouter();

    useEffect(() => {
        const { fetch: originalFetch } = window;

        // Global fetch interceptor for security handling (401 Unauthorized / Token Expiry)
        window.fetch = async (...args) => {
            const response = await originalFetch(...args);
            
            if (response.status === 401) {
                const token = localStorage.getItem('token');
                // Only trigger redirect if a token actually existed (avoids loops on login api itself)
                if (token) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('userRole');
                    
                    toast.error('Session expired. Please log in again.', { id: 'session-expired' });
                    
                    // Trigger storage event to alert layout/component states
                    window.dispatchEvent(new Event('storage'));
                    
                    router.push('/login?expired=true');
                }
            }
            
            return response;
        };

        return () => {
            window.fetch = originalFetch;
        };
    }, [router]);

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
