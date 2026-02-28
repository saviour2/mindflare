import React from 'react';

export default function AnalyticsPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Analytics</h1>
            <div className="p-8 text-center bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400">Charts (Recharts) will be displayed here tracking API tokens, latency, and costs over time.</p>
            </div>
        </div>
    );
}
