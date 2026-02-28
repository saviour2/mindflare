import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0';

export async function GET() {
    try {
        const session = await auth0.getSession();
        if (!session || !session.user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { user } = session;

        // Send this to our Python backend to sync
        const res = await fetch('http://localhost:5000/api/auth/auth0-sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                auth0_sub: user.sub,
                email: user.email,
                name: user.name || user.nickname || 'User',
                picture: user.picture
            })
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
