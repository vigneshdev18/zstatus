import { cn } from "@/lib/utils/cn";
import { ChangeEvent, forwardRef, useState } from "react";
import InputLabel from "./InputLabel";
import { InputFieldProps } from "@/lib/types/components.inputs";
import InputError from "./InputError";
import { HiEye, HiEyeOff } from "react-icons/hi";

const InputField = forwardRef<
  HTMLInputElement | HTMLTextAreaElement,
  InputFieldProps
>(
  (
    {
      containerClassName,
      inputContainerClassName,
      rightIcon,
      label,
      className,
      ignoreNegativeNumbers = true,
      onChange,
      labelClassName,
      error,
      errorPosition = "bottom",
      hideError,
      as = "input",
      rows = 3,
      ...props
    },
    ref,
  ) => {
    const isUncontrolled = !("value" in props);
    const [showPassword, setShowPassword] = useState(false);
    const isPassword = props.type === "password";
    const inputType = isPassword
      ? showPassword
        ? "text"
        : "password"
      : props.type;

    const _onChangeWrapper = (
      event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    ) => {
      if (!onChange) return;

      if (
        props?.type === "number" &&
        ignoreNegativeNumbers &&
        "value" in event.target &&
        parseFloat(event.target.value) < 0
      ) {
        event.target.value = String(parseFloat(event.target.value) * -1);
      }
      onChange(event as any);
    };

    const onKeyDownOnNumber = (
      event: React.KeyboardEvent<HTMLInputElement>,
    ) => {
      const ignorableKeys = ["+", "-", ".", "E", "e"];
      if (ignorableKeys.includes(event.key)) {
        event.preventDefault();
      }
    };

    const baseClassName = cn(
      "w-full px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-purple-500",
      // "w-full px-4 py-3 bg-white/5 border rounded-xl text-white placeholder-gray-500 transition-smooth focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent",
      className,
      error ? "border-red-500" : "border-white/10",
      props.disabled && "cursor-not-allowed opacity-50",
    );

    return (
      <div className={cn("w-full", containerClassName)}>
        <div className="flex justify-between items-end">
          <InputLabel
            required={props.required}
            name={props?.name}
            label={label}
            htmlFor={props?.id}
            className={labelClassName}
          />
          {!hideError && errorPosition === "top" && (
            <InputError className="mb-1">{error}</InputError>
          )}
        </div>
        <div
          className={cn(
            "flex flex-row items-center justify-start w-full relative",
            inputContainerClassName,
          )}
        >
          {as === "textarea" ? (
            <textarea
              id={props?.name}
              ref={ref as any}
              required={props?.required}
              className={baseClassName}
              rows={rows}
              {...(isUncontrolled ? {} : { value: props.value || "" })}
              {...(props as any)}
              onChange={_onChangeWrapper}
            />
          ) : (
            <input
              id={props?.name}
              ref={ref as any}
              required={props?.required}
              className={baseClassName}
              {...(isUncontrolled ? {} : { value: props.value || "" })}
              {...props}
              type={inputType}
              onChange={_onChangeWrapper}
              onWheel={(event) => {
                if (props.type === "number") {
                  event.currentTarget.blur();
                }
              }}
              onKeyDown={
                props.onKeyDown ??
                (props?.type === "number" ? onKeyDownOnNumber : undefined)
              }
            />
          )}
          {rightIcon && (
            <div className="absolute bg-transparent border-0 outline-0 right-5 transition-all duration-300">
              {rightIcon}
            </div>
          )}
          {isPassword && (
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-4 text-gray-400 hover:text-white transition-colors"
              tabIndex={-1}
            >
              {showPassword ? (
                <HiEyeOff className="w-5 h-5" />
              ) : (
                <HiEye className="w-5 h-5" />
              )}
            </button>
          )}
        </div>
        {!hideError && errorPosition === "bottom" && (
          <InputError>{error}</InputError>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
