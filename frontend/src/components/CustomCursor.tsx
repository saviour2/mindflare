'use client';

import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';

export default function CustomCursor() {
    const [isHovered, setIsHovered] = useState(false);
    const [isPointer, setIsPointer] = useState(false);
    const [isVisible, setIsVisible] = useState(false);

    const cursorX = useMotionValue(-100);
    const cursorY = useMotionValue(-100);

    const springConfig = { damping: 25, stiffness: 250 };
    const cursorXSpring = useSpring(cursorX, springConfig);
    const cursorYSpring = useSpring(cursorY, springConfig);
    const trailingXSpring = useSpring(cursorX, { damping: 40, stiffness: 150 });
    const trailingYSpring = useSpring(cursorY, { damping: 40, stiffness: 150 });
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return;

        const moveCursor = (e: MouseEvent) => {
            cursorX.set(e.clientX);
            cursorY.set(e.clientY);
            if (!isVisible) setIsVisible(true);
        };

        const handleMouseOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const isClickable =
                window.getComputedStyle(target).cursor === 'pointer' ||
                target.tagName === 'A' ||
                target.tagName === 'BUTTON' ||
                target.closest('button') ||
                target.closest('a');

            setIsPointer(!!isClickable);
        };

        const handleMouseDown = () => setIsHovered(true);
        const handleMouseUp = () => setIsHovered(false);
        const handleMouseLeave = () => setIsVisible(false);
        const handleMouseEnter = () => setIsVisible(true);

        window.addEventListener('mousemove', moveCursor);
        window.addEventListener('mouseover', handleMouseOver);
        window.addEventListener('mousedown', handleMouseDown);
        window.addEventListener('mouseup', handleMouseUp);
        document.addEventListener('mouseleave', handleMouseLeave);
        document.addEventListener('mouseenter', handleMouseEnter);

        return () => {
            window.removeEventListener('mousemove', moveCursor);
            window.removeEventListener('mouseover', handleMouseOver);
            window.removeEventListener('mousedown', handleMouseDown);
            window.removeEventListener('mouseup', handleMouseUp);
            document.removeEventListener('mouseleave', handleMouseLeave);
            document.removeEventListener('mouseenter', handleMouseEnter);
        };
    }, [cursorX, cursorY, isVisible, isMounted]);

    if (!isMounted || typeof window === 'undefined') return null;

    return (
        <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
            {/* Outer Ring / Glow - Leading with spring */}
            <motion.div
                style={{
                    translateX: cursorXSpring,
                    translateY: cursorYSpring,
                    left: -20,
                    top: -20,
                }}
                animate={{
                    scale: isPointer ? 1.4 : isHovered ? 0.7 : 1,
                    opacity: isVisible ? 1 : 0,
                    borderColor: isPointer ? 'rgba(212, 175, 55, 0.6)' : 'rgba(212, 175, 55, 0.2)',
                    backgroundColor: isPointer ? 'rgba(212, 175, 55, 0.1)' : 'rgba(212, 175, 55, 0.02)',
                }}
                className="w-[40px] h-[40px] rounded-full border backdrop-blur-[2px] absolute flex items-center justify-center transition-colors duration-500"
            />

            {/* Trailing Particle for Neural feel */}
            <motion.div
                style={{
                    translateX: trailingXSpring,
                    translateY: trailingYSpring,
                    left: -4,
                    top: -4,
                }}
                animate={{
                    opacity: isVisible ? 0.4 : 0,
                    scale: isPointer ? 2 : 1,
                }}
                className="w-2 h-2 rounded-full bg-gold-base absolute blur-[2px]"
            />

            {/* Main Cursor Triangle / Tip - Zero lag for precision */}
            <motion.div
                style={{
                    translateX: cursorX,
                    translateY: cursorY,
                    left: -2,
                    top: -2,
                }}
                animate={{
                    scale: isHovered ? 0.8 : 1,
                    rotate: isPointer ? 15 : 0,
                    opacity: isVisible ? 1 : 0,
                }}
                className="absolute transition-opacity duration-300"
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="drop-shadow-[0_0_10px_rgba(212,175,55,0.6)]"
                >
                    <path
                        d="M3 3L21 12L12 15L9 21L3 3Z"
                        fill="white"
                        stroke="#d4af37"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                    />
                </svg>
            </motion.div>

            {/* Pointer Interaction Dot */}
            <AnimatePresence>
                {isPointer && (
                    <motion.div
                        style={{
                            translateX: cursorXSpring,
                            translateY: cursorYSpring,
                            left: -1,
                            top: -1,
                        }}
                        initial={{ scale: 0, opacity: 0 }}
                        animate={{ scale: 6, opacity: 0.1 }}
                        exit={{ scale: 0, opacity: 0 }}
                        className="w-0.5 h-0.5 rounded-full bg-gold-light absolute"
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
