import { auth0 } from '@/lib/auth0';
import type { NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
    return await auth0.middleware(request);
}

export const config = {
    matcher: [
        /*
         * Match all request paths except static files and metadata.
         */
        '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
