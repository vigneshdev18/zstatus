export interface InputFieldProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClassName?: string;
  inputContainerClassName?: string;
  rightIcon?: React.ReactNode;
  label?: string;
  labelClassName?: string;
  error?: string;
  errorPosition?: "top" | "bottom";
  hideError?: boolean;
  ignoreNegativeNumbers?: boolean;
  as?: "input" | "textarea";
  rows?: number;
}
