import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
    try {
        const session = await auth0.getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user } = session;

        // Send the raw Auth0 access token to the backend for secure verification
        const { token } = await auth0.getAccessToken();

        const res = await fetch('http://localhost:5000/api/auth/auth0-sync', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            }
        });

        const data = await res.json();
        if (!res.ok) {
            return NextResponse.json({ error: data.error }, { status: res.status });
        }

        return NextResponse.json(data);
    } catch (err) {
        console.error("Auth0 sync error:", err);
        return NextResponse.json({ error: 'Failed to sync with backend' }, { status: 500 });
    }
}
