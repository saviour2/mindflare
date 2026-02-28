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
        const baseStyles = "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-all focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50 active:scale-95"

        const variants = {
            default: "bg-white text-black hover:bg-zinc-200 shadow-[0_1px_2px_rgba(255,255,255,0.1)]",
            ghost: "hover:bg-white/5 text-zinc-400 hover:text-white",
            outline: "border border-white/10 bg-transparent hover:bg-white/5 text-white",
            link: "text-zinc-400 underline-offset-4 hover:underline hover:text-white"
        }

        const sizes = {
            default: "h-11 px-6 py-2",
            sm: "h-9 px-3",
            lg: "h-14 px-10 text-base",
            icon: "h-10 w-10"
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
