import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "@/lib/utils";

interface CyberButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "correct" | "incorrect" | "outline";
  size?: "default" | "lg" | "xl";
}

const CyberButton = forwardRef<HTMLButtonElement, CyberButtonProps>(
  ({ className, variant = "primary", size = "default", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "relative overflow-hidden font-semibold transition-all duration-300 rounded-lg",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "before:absolute before:inset-0 before:bg-gradient-to-r before:opacity-0 before:transition-opacity before:duration-300",
          "hover:before:opacity-100 active:scale-95",
          {
            // Primary - Electric blue with glow
            "bg-primary text-primary-foreground shadow-[0_0_20px_hsl(var(--primary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]":
              variant === "primary",
            "before:from-primary before:via-cyber-blue before:to-primary": variant === "primary",
            
            // Secondary - Neon green
            "bg-secondary text-secondary-foreground shadow-[0_0_20px_hsl(var(--secondary)/0.3)] hover:shadow-[0_0_30px_hsl(var(--secondary)/0.5)]":
              variant === "secondary",
            "before:from-secondary before:via-cyber-green before:to-secondary": variant === "secondary",
            
            // Correct answer
            "bg-cyber-green text-background shadow-[0_0_20px_hsl(var(--cyber-green)/0.4)]":
              variant === "correct",
            
            // Incorrect answer
            "bg-cyber-red text-foreground shadow-[0_0_20px_hsl(var(--cyber-red)/0.4)]":
              variant === "incorrect",
            
            // Outline
            "bg-transparent border-2 border-primary text-primary hover:bg-primary hover:text-primary-foreground":
              variant === "outline",
            
            // Sizes
            "px-6 py-3 text-base": size === "default",
            "px-8 py-4 text-lg": size === "lg",
            "px-10 py-5 text-xl": size === "xl",
          },
          className
        )}
        {...props}
      >
        <span className="relative z-10">{children}</span>
      </button>
    );
  }
);

CyberButton.displayName = "CyberButton";

export default CyberButton;
