import { ButtonHTMLAttributes, forwardRef, ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

// Variant styles
const variantStyles = {
  primary: "bg-gradient-primary text-white hover:scale-105 shadow-gradient",
  secondary: "glass text-white hover:bg-white/10",
  danger: "bg-gradient-danger text-white hover:scale-105 shadow-gradient",
  dangerSubtle:
    "bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-300",
  ghost: "text-gray-300 hover:text-white hover:bg-white/10 cursor-pointer",
  accent:
    "bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 text-purple-300",
  icon: "glass hover:bg-white/10",
};

// Size styles
const sizeStyles = {
  sm: "px-4 py-2 text-sm",
  md: "px-6 py-3 text-base",
  lg: "px-8 py-4 text-lg",
  icon: "p-2",
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?:
    | "primary"
    | "secondary"
    | "danger"
    | "dangerSubtle"
    | "ghost"
    | "accent"
    | "icon";
  size?: "sm" | "md" | "lg" | "icon";
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      variant = "primary",
      size = "md",
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    // Base styles
    const baseStyles =
      "rounded-xl font-medium transition-smooth disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center justify-center gap-2";

    // Combine all styles
    const buttonClasses = cn(
      baseStyles,
      variantStyles[variant],
      sizeStyles[size],
      fullWidth && "w-full",
      (loading || disabled) && "disabled:hover:scale-100",
      className
    );

    return (
      <button
        ref={ref}
        className={buttonClasses}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
        )}
        {!loading && leftIcon && <span>{leftIcon}</span>}
        {children}
        {!loading && rightIcon && <span>{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";

export default Button;
