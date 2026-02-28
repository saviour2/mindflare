// src/hooks/useAuth.ts
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';
import { useEffect, useState } from 'react';

export function useAuth() {
    const { user, isLoading: auth0Loading, error } = useUser();
    const [isSyncing, setIsSyncing] = useState(false);

    useEffect(() => {
        if (user && !auth0Loading && typeof window !== 'undefined') {
            const currentToken = localStorage.getItem('token');
            if (!currentToken) {
                // Sync Auth0 with Python backend to get a CLI/SDK compatible token
                setIsSyncing(true);
                fetch('/api/auth/sync')
                    .then(r => r.json())
                    .then(d => {
                        if (d.token) {
                            localStorage.setItem('token', d.token);
                        }
                    })
                    .finally(() => setIsSyncing(false));
            }
        } else if (!user && !auth0Loading && typeof window !== 'undefined') {
            // Unauthenticated
            localStorage.removeItem('token');
        }
    }, [user, auth0Loading]);

    const login = () => {
        window.location.href = '/api/auth/login';
    };

    const logout = () => {
        localStorage.removeItem('token');
        window.location.href = '/api/auth/logout';
    };

    return {
        user: user ?? null,
        isLoading: auth0Loading || isSyncing,
        error,
        isAuthenticated: !!user,
        login,
        logout,
    };
}
