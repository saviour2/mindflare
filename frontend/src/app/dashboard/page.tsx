import React from 'react';

export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <h1 className="text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 bg-gray-800 rounded-lg shadow border border-gray-700">
                    <h2 className="text-xl font-semibold mb-2">Total Applications</h2>
                    <p className="text-4xl">0</p>
                </div>
                <div className="p-6 bg-gray-800 rounded-lg shadow border border-gray-700">
                    <h2 className="text-xl font-semibold mb-2">Knowledge Bases</h2>
                    <p className="text-4xl">0</p>
                </div>
                <div className="p-6 bg-gray-800 rounded-lg shadow border border-gray-700">
                    <h2 className="text-xl font-semibold mb-2">API Requests Today</h2>
                    <p className="text-4xl">0</p>
                </div>
            </div>
        </div>
    );
}
