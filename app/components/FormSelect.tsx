import Select, { SelectOption, SelectProps } from "./Select";
import React from "react";
import {
  FieldValues,
  useFormContext,
  Controller,
  RegisterOptions,
} from "react-hook-form";

interface FormSelectProps
  extends Omit<SelectProps, "value" | "onChange" | "error"> {
  name: string;
  validationOptions?: RegisterOptions<FieldValues, string>;
}

const FormSelect = ({ name, validationOptions, ...selectProps }: FormSelectProps) => {
  const {
    control,
    formState: { errors },
  } = useFormContext();

  const error = errors?.[name]?.message as string | undefined;

  return (
    <Controller
      name={name}
      control={control}
      rules={validationOptions}
      render={({ field }) => {
        // Find the option that matches the field value
        const optionsArray = selectProps.options as SelectOption[] | undefined;
        const selectedOption =
          optionsArray?.find((opt) => opt.value === field.value) || null;

        return (
          <Select
            {...selectProps}
            value={selectedOption}
            onChange={(option) => {
              // Extract the value from the selected option
              if (!option) {
                field.onChange(undefined);
                return;
              }
              
              const selectOption = option as SelectOption;
              field.onChange(selectOption.value);
            }}
            error={error}
          />
        );
      }}
    />
  );
};

export default FormSelect;
