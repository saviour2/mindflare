import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
    // Explicitly pass appBaseUrl so the SDK knows the correct redirect URI
    appBaseUrl: process.env.APP_BASE_URL || 'http://localhost:3000',

    routes: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        callback: '/api/auth/callback',
    },

    // Fix "state parameter is invalid" on localhost by ensuring
    // the transaction cookie is NOT marked as Secure (http != https)
    transactionCookie: {
        sameSite: 'lax',
        secure: false,
    },

    // Session cookie also needs to work over plain http on localhost
    session: {
        cookie: {
            sameSite: 'lax',
            secure: false,
        },
    }
});
