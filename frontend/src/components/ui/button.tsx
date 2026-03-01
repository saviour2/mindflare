import * as React from "react"
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
    return twMerge(clsx(inputs))
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'default' | 'ghost' | 'outline' | 'link'
    size?: 'default' | 'sm' | 'lg' | 'icon'
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
    ({ className, variant = 'default', size = 'default', ...props }, ref) => {
        // Base: retro pixel button — no border-radius, hard block shadow, chunky border
        const baseStyles = [
            "inline-flex items-center justify-center whitespace-nowrap",
            "font-pixel text-lg leading-none tracking-wide",
            "border-3 border-retro-border",
            "transition-none focus-visible:outline-none",
            "disabled:pointer-events-none disabled:opacity-40",
            // Depress on active: shift transform + shrink shadow
            "active:translate-x-[2px] active:translate-y-[2px] active:shadow-pixel-press",
        ].join(' ')

        const variants = {
            default: [
                "bg-retro-cyan text-retro-ink border-[#D68FA3]",
                "shadow-pixel-cyan",
                "hover:bg-[#E89DB0] hover:shadow-[3px_3px_0px_#D68FA3]",
            ].join(' '),
            ghost: [
                "border-transparent bg-transparent text-retro-muted",
                "hover:bg-retro-panel hover:text-retro-white hover:border-retro-border",
                "shadow-none",
            ].join(' '),
            outline: [
                "bg-transparent text-retro-white border-retro-border",
                "shadow-pixel",
                "hover:bg-retro-panel hover:border-retro-cyan",
            ].join(' '),
            link: [
                "border-none bg-transparent text-retro-cyan shadow-none",
                "underline-offset-4 hover:underline hover:text-retro-white",
            ].join(' '),
        }

        const sizes = {
            default: "h-11 px-6 py-2 text-xl",
            sm: "h-9 px-4 text-lg",
            lg: "h-14 px-10 text-2xl",
            icon: "h-10 w-10 text-xl",
        }

        return (
            <button
                ref={ref}
                className={cn(baseStyles, variants[variant], sizes[size], className)}
                {...props}
            />
        )
    }
)
Button.displayName = "Button"

export { Button }
