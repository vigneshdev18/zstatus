interface InputLabelProps {
  label?: string;
  required?: boolean;
  name?: string;
  htmlFor?: string;
  className?: string;
}

export default function InputLabel({
  label,
  required,
  name,
  htmlFor,
  className,
}: InputLabelProps) {
  if (!label) return null;

  return (
    <label
      htmlFor={htmlFor || name}
      className={`block text-sm font-medium text-gray-300 mb-2 ${
        className || ""
      }`}
    >
      {label}
      {required && <span className="text-red-400 ml-1">*</span>}
    </label>
  );
}
