import { forwardRef } from "react";
import { cn } from "@/lib/utils/cn";

export interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
  labelPosition?: "left" | "right";
  className?: string;
  name?: string;
  id?: string;
}

const Switch = forwardRef<HTMLButtonElement, SwitchProps>(
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
      sm: {
        container: "h-4 w-7",
        toggle: "h-2.5 w-2.5",
        translateOn: "translate-x-3.5",
        translateOff: "translate-x-0.5",
      },
      md: {
        container: "h-5 w-9",
        toggle: "h-3 w-3",
        translateOn: "translate-x-5",
        translateOff: "translate-x-1",
      },
    };

    const currentSize = sizeStyles[size];

    const handleClick = () => {
      if (!disabled) {
        onChange(!checked);
      }
    };

    const switchElement = (
      <button
        ref={ref}
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={label}
        name={name}
        id={id}
        onClick={handleClick}
        disabled={disabled}
        className={cn(
          "relative inline-flex items-center rounded-full transition-colors",
          checked ? "bg-purple-500" : "bg-gray-600",
          disabled && "opacity-50 cursor-not-allowed",
          !disabled && "cursor-pointer",
          currentSize.container,
          !label && className
        )}
      >
        <span
          className={cn(
            "inline-block transform rounded-full bg-white transition-transform",
            checked ? currentSize.translateOn : currentSize.translateOff,
            currentSize.toggle
          )}
        />
      </button>
    );

    if (!label) {
      return switchElement;
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
        {switchElement}
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

Switch.displayName = "Switch";

export default Switch;
