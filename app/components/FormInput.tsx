import InputField from "./Input/Input";
import { FieldValues, RegisterOptions, useFormContext } from "react-hook-form";
import { InputFieldProps } from "@/types/components.inputs";

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
