import { useFieldContext } from "#/hooks/form-context";
import type { ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "./field";
import { Input } from "./input";

export type TextFieldProps = {
  readonly label: ReactNode;
  readonly placeholder?: string;
};

export const TextField = ({ label, placeholder }: TextFieldProps) => {
  const field = useFieldContext<string>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Input
        id={field.name}
        name={field.name}
        value={field.state.value}
        onBlur={field.handleBlur}
        onChange={(e) => field.handleChange(e.target.value)}
        aria-invalid={isInvalid}
        placeholder={placeholder}
      />
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
};
