import React from 'react';

export default function ApplicationsPage() {
    return (
        <div className="min-h-screen bg-gray-900 text-white p-8">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-3xl font-bold">Applications</h1>
                <button className="bg-blue-600 px-4 py-2 rounded shadow hover:bg-blue-500">+ Create App</button>
            </div>
            <div className="p-8 text-center bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-gray-400">No applications created yet.</p>
            </div>
        </div>
    );
}
