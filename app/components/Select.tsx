"use client";

import ReactSelect, {
  Props as ReactSelectProps,
  StylesConfig,
} from "react-select";
import { useId } from "react";
import { cn } from "@/lib/utils/cn";
import InputLabel from "@/app/components/Input/InputLabel";
import InputError from "@/app/components/Input/InputError";

export interface SelectOption {
  value: string;
  label: string;
}

export interface SelectProps extends Omit<ReactSelectProps<SelectOption>, "styles"> {
  error?: string | boolean;
  instanceId?: string;
  label?: string;
  required?: boolean;
  labelClassName?: string;
  containerClassName?: string;
  errorPosition?: "top" | "bottom";
  hideError?: boolean;
}

const customStyles: StylesConfig<SelectOption> = {
  control: (provided, state) => ({
    ...provided,
    backgroundColor: "rgba(255, 255, 255, 0.05)",
    borderColor: state.isFocused
      ? "rgb(139, 92, 246)" // purple-500
      : "rgba(255, 255, 255, 0.1)",
    borderWidth: "1px",
    borderRadius: "0.75rem", // rounded-xl
    padding: "0.5rem 0.75rem",
    minHeight: "3rem",
    boxShadow: state.isFocused ? "0 0 0 2px rgba(139, 92, 246, 0.5)" : "none",
    transition: "all 0.3s ease",
    cursor: "pointer",
    "&:hover": {
      borderColor: state.isFocused
        ? "rgb(139, 92, 246)"
        : "rgba(255, 255, 255, 0.2)",
    },
  }),
  menu: (provided) => ({
    ...provided,
    backgroundColor: "rgba(17, 24, 39, 0.95)", // dark with slight transparency
    backdropFilter: "blur(12px)",
    borderRadius: "0.75rem",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    boxShadow:
      "0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 10px 10px -5px rgba(0, 0, 0, 0.2)",
    overflow: "hidden",
    marginTop: "0.5rem",
  }),
  menuList: (provided) => ({
    ...provided,
    padding: "0.5rem",
    maxHeight: "300px",
  }),
  option: (provided, state) => ({
    ...provided,
    backgroundColor: state.isSelected
      ? "rgba(139, 92, 246, 0.2)" // purple-500 with opacity
      : state.isFocused
      ? "rgba(255, 255, 255, 0.05)"
      : "transparent",
    color: state.isSelected ? "rgb(255, 255, 255)" : "rgb(209, 213, 219)", // white or gray-300
    padding: "0.75rem 1rem",
    borderRadius: "0.5rem",
    cursor: "pointer",
    transition: "all 0.2s ease",
    marginBottom: "0.25rem",
    "&:active": {
      backgroundColor: "rgba(139, 92, 246, 0.3)",
    },
    "&:last-child": {
      marginBottom: 0,
    },
  }),
  singleValue: (provided) => ({
    ...provided,
    color: "rgb(255, 255, 255)", // white
  }),
  placeholder: (provided) => ({
    ...provided,
    color: "rgb(107, 114, 128)", // gray-500
  }),
  input: (provided) => ({
    ...provided,
    color: "rgb(255, 255, 255)", // white
    margin: 0,
    padding: 0,
  }),
  indicatorSeparator: () => ({
    display: "none",
  }),
  dropdownIndicator: (provided, state) => ({
    ...provided,
    color: state.isFocused ? "rgb(139, 92, 246)" : "rgba(255, 255, 255, 0.4)",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "rgb(139, 92, 246)",
    },
  }),
  clearIndicator: (provided) => ({
    ...provided,
    color: "rgba(255, 255, 255, 0.4)",
    transition: "all 0.2s ease",
    "&:hover": {
      color: "rgb(239, 68, 68)", // red-500
    },
  }),
};

export default function Select({
  instanceId,
  label,
  required,
  labelClassName,
  containerClassName,
  error,
  errorPosition = "bottom",
  hideError,
  ...props
}: SelectProps) {
  const generatedId = useId();
  const stableId = instanceId || generatedId;
  const selectId = props.id || stableId;
  const errorMessage = typeof error === "string" ? error : error ? "This field is required" : undefined;

  // Update styles to show error state
  const errorStyles: StylesConfig<SelectOption> = error
    ? {
        ...customStyles,
        control: (provided, state) => {
          const baseControl = customStyles.control?.(provided, state) || {};
          return {
            ...baseControl,
            borderColor: "rgb(239, 68, 68)", // red-500
            "&:hover": {
              borderColor: "rgb(239, 68, 68)",
            },
          };
        },
      }
    : customStyles;

  return (
    <div className={cn("w-full", containerClassName)}>
      <div className="flex justify-between items-end">
        <InputLabel
          required={required}
          name={props.name}
          label={label}
          htmlFor={selectId}
          className={labelClassName}
        />
        {!hideError && errorPosition === "top" && (
          <InputError className="mb-1">{errorMessage}</InputError>
        )}
      </div>
      <ReactSelect
        {...props}
        id={selectId}
        instanceId={stableId}
        styles={errorStyles}
        className="react-select-container"
        classNamePrefix="react-select"
        theme={(theme) => ({
          ...theme,
          borderRadius: 12,
          colors: {
            ...theme.colors,
            primary: "rgb(139, 92, 246)", // purple-500
            primary75: "rgba(139, 92, 246, 0.75)",
            primary50: "rgba(139, 92, 246, 0.5)",
            primary25: "rgba(139, 92, 246, 0.25)",
            danger: "rgb(239, 68, 68)", // red-500
            dangerLight: "rgba(239, 68, 68, 0.25)",
            neutral0: "rgba(17, 24, 39, 0.95)", // dark background
            neutral5: "rgba(255, 255, 255, 0.05)",
            neutral10: "rgba(255, 255, 255, 0.1)",
            neutral20: "rgba(255, 255, 255, 0.2)",
            neutral30: "rgba(255, 255, 255, 0.3)",
            neutral40: "rgba(255, 255, 255, 0.4)",
            neutral50: "rgba(255, 255, 255, 0.5)",
            neutral60: "rgba(255, 255, 255, 0.6)",
            neutral70: "rgba(255, 255, 255, 0.7)",
            neutral80: "rgba(255, 255, 255, 0.8)",
            neutral90: "rgba(255, 255, 255, 0.9)",
          },
        })}
      />
      {!hideError && errorPosition === "bottom" && (
        <InputError>{errorMessage}</InputError>
      )}
    </div>
  );
}
