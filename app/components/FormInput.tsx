import InputField from "./Input/Input";
import React from "react";
import { FieldValues, useFormContext, RegisterOptions } from "react-hook-form";
import { InputFieldProps } from "@/lib/types/components.inputs";

const FormInput = ({
  options,
  ...props
}: InputFieldProps & { options?: RegisterOptions<FieldValues, string> }) => {
  const {
    register,
    formState: { errors },
  } = useFormContext();

  return (
    <InputField
      {...props}
      {...register(props.name!, options)}
      error={errors?.[props.name!]?.message as string}
    />
  );
};

export default FormInput;
