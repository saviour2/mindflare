'use client';

import { useEffect, useRef } from 'react';

export default function CustomCursor() {
    const cursorRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const cursor = cursorRef.current;
        if (!cursor) return;

        let rafId: number;
        let mouseX = -100;
        let mouseY = -100;
        let currentX = -100;
        let currentY = -100;

        const onMouseMove = (e: MouseEvent) => {
            mouseX = e.clientX;
            mouseY = e.clientY;
        };

        const onMouseLeave = () => {
            mouseX = -200;
            mouseY = -200;
        };

        // Smooth follow with lerp
        const animate = () => {
            currentX += (mouseX - currentX) * 0.12;
            currentY += (mouseY - currentY) * 0.12;
            if (cursor) {
                cursor.style.transform = `translate(${currentX}px, ${currentY}px) translate(-50%, -50%)`;
            }
            rafId = requestAnimationFrame(animate);
        };

        document.addEventListener('mousemove', onMouseMove);
        document.addEventListener('mouseleave', onMouseLeave);
        rafId = requestAnimationFrame(animate);

        // Hide default cursor globally
        document.documentElement.style.cursor = 'none';

        return () => {
            document.removeEventListener('mousemove', onMouseMove);
            document.removeEventListener('mouseleave', onMouseLeave);
            cancelAnimationFrame(rafId);
            document.documentElement.style.cursor = '';
        };
    }, []);

    return (
        <div
            ref={cursorRef}
            className="pointer-events-none fixed top-0 left-0 z-[9999] will-change-transform"
            style={{ transition: 'opacity 0.2s' }}
        >
            {/* Sakura petal cursor */}
            <img
                src="/sakura.png"
                alt=""
                width={36}
                height={36}
                style={{ display: 'block', userSelect: 'none', draggable: 'false' } as React.CSSProperties}
            />
        </div>
    );
}
