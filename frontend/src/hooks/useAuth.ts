// src/hooks/useAuth.ts
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

export function useAuth() {
    const { user: auth0User, isLoading: auth0Loading, error } = useUser();
    const [backendUser, setBackendUser] = useState<any>(null);
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (auth0User && !auth0Loading && typeof window !== 'undefined') {
            const currentToken = localStorage.getItem('token');

            const fetchBackendProfile = async (tk: string) => {
                try {
                    const res = await fetch('http://localhost:5000/api/auth/me', {
                        headers: { 'Authorization': `Bearer ${tk}` }
                    });
                    const d = await res.json();
                    if (d.user) setBackendUser(d.user);
                } catch (err) {
                    console.error("Failed to fetch backend profile:", err);
                }
            };

            if (!currentToken) {
                // Sync Auth0 with Python backend to get a CLI/SDK compatible token
                setIsSyncing(true);
                fetch('/api/auth/sync')
                    .then(r => r.json())
                    .then(d => {
                        if (d.token) {
                            localStorage.setItem('token', d.token);
                            if (d.user) setBackendUser(d.user);
                            else fetchBackendProfile(d.token);
                        }
                    })
                    .finally(() => setIsSyncing(false));
            } else if (!backendUser) {
                fetchBackendProfile(currentToken);
            }
        } else if (!auth0User && !auth0Loading && typeof window !== 'undefined') {
            // Unauthenticated
            localStorage.removeItem('token');
            setBackendUser(null);
        }
    }, [auth0User, auth0Loading, backendUser]);

    const login = () => {
        window.location.href = '/api/auth/login';
    };

    const logout = () => {
        localStorage.removeItem('token');
        setBackendUser(null);
        window.location.href = '/api/auth/logout';
    };

    return {
        user: backendUser ? { ...auth0User, ...backendUser } : (auth0User ?? null),
        isLoading: auth0Loading || isSyncing,
        error,
        isAuthenticated: !!auth0User,
        login,
        logout,
    };
}
