import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Reads AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET, AUTH0_SECRET,
// and APP_BASE_URL from environment variables automatically.
export const auth0 = new Auth0Client({
    routes: {
        login: '/api/auth/login',
        logout: '/api/auth/logout',
        callback: '/api/auth/callback',
        backChannelLogout: '/api/auth/backchannel-logout',
    },
});
