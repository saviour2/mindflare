"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function GitHubCallbackPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    useEffect(() => {
        const code = searchParams.get("code");
        const state = searchParams.get("state");
        const token = localStorage.getItem("token");

        if (!code || !state || !token) {
            router.replace("/knowledge-base?gh=error");
            return;
        }

        fetch("http://localhost:5000/api/github/callback", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`,
            },
            body: JSON.stringify({ code, state }),
        })
            .then((r) => r.json())
            .then((data) => {
                if (data.github_login) {
                    router.replace(`/knowledge-base?gh=connected&login=${data.github_login}`);
                } else {
                    router.replace("/knowledge-base?gh=error");
                }
            })
            .catch(() => router.replace("/knowledge-base?gh=error"));
    }, []);

    return (
        <div className="min-h-screen bg-[#050505] flex items-center justify-center">
            <div className="text-center space-y-4">
                <div className="w-12 h-12 border-2 border-white/20 border-t-white rounded-full animate-spin mx-auto" />
                <p className="text-zinc-400 font-sans">Connecting GitHub…</p>
            </div>
        </div>
    );
}
