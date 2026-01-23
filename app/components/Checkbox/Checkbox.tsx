import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface CheckboxProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md" | "lg";
  label?: string;
  labelPosition?: "left" | "right";
  className?: string;
  name?: string;
  id?: string;
}

const Checkbox = forwardRef<HTMLInputElement, CheckboxProps>(
  (
    {
      checked,
      onChange,
      disabled = false,
      size = "md",
      label,
      labelPosition = "right",
      className,
      name,
      id,
    },
    ref
  ) => {
    const sizeStyles = {
      sm: "w-5 h-4",
      md: "w-6 h-5",
      lg: "w-7 h-6",
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
      if (!disabled) {
        onChange(e.target.checked);
      }
    };

    const checkboxElement = (
      <button
        type="button"
        ref={ref as any}
        role="checkbox"
        aria-checked={checked}
        id={id}
        name={name}
        disabled={disabled}
        tabIndex={0}
        onClick={() => !disabled && onChange(!checked)}
        onKeyDown={(e) => {
          if (!disabled && (e.key === " " || e.key === "Enter")) {
            e.preventDefault();
            onChange(!checked);
          }
        }}
        className={cn(
          "relative inline-flex items-center justify-center outline-none",
          "transition-colors duration-200",
          sizeStyles[size],
          disabled
            ? "cursor-not-allowed opacity-50"
            : "cursor-pointer",
          className
        )}
      >
        <span
          className={cn(
            "absolute inset-0 rounded border border-gray-600 bg-gray-700 transition-all duration-200 flex items-center justify-center",
            checked
              ? "border-purple-600 bg-purple-600/80"
              : "bg-gray-700",
            "shadow-inner"
          )}
        />
        <span
          className={cn(
            "pointer-events-none z-10 flex items-center justify-center",
              checked ? "opacity-100 scale-100 transition-all duration-200": "opacity-0 scale-75 transition-all duration-200",
          )}
        >
          {/* Checkmark SVG */}
          <svg
            viewBox="0 0 20 20"
            fill="none"
            width={size === "sm" ? 12 : size === "lg" ? 18 : 14}
            height={size === "sm" ? 12 : size === "lg" ? 18 : 14}
          >
            <polyline
              points="5 11 9 15 15 7"
              stroke="#fff"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        {/* For accessibility: visually hidden input */}
        <input
          type="checkbox"
          checked={checked}
          disabled={disabled}
          onChange={handleChange}
          name={name}
          id={id}
          className="absolute opacity-0 w-0 h-0"
          tabIndex={-1}
          aria-hidden
        />
      </button>
    );

    if (!label) {
      return checkboxElement;
    }

    return (
      <div className={cn("flex items-center gap-2", className)}>
        {labelPosition === "left" && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm text-gray-300",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {label}
          </label>
        )}
        {checkboxElement}
        {labelPosition === "right" && (
          <label
            htmlFor={id}
            className={cn(
              "text-sm text-gray-300",
              disabled ? "cursor-not-allowed" : "cursor-pointer"
            )}
          >
            {label}
          </label>
        )}
      </div>
    );
  }
);

Checkbox.displayName = "Checkbox";

export default Checkbox;
