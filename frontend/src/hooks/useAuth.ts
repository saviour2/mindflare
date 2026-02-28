// src/hooks/useAuth.ts
'use client';

import { useUser } from '@auth0/nextjs-auth0/client';

export function useAuth() {
    const { user, isLoading, error } = useUser();

    const login = () => {
        window.location.href = '/api/auth/login';
    };

    const logout = () => {
        window.location.href = '/api/auth/logout';
    };

    return {
        user: user ?? null,
        isLoading,
        error,
        isAuthenticated: !!user,
        login,
        logout,
    };
}
