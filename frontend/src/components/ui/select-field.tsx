import { useFieldContext } from "#/hooks/form-context";
import type { ReactNode } from "react";
import { Field, FieldError, FieldLabel } from "./field";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

type SelectOption = {
  value: string;
  label: string;
};

export type SelectFieldProps = {
  readonly label: ReactNode;
  readonly placeholder?: string;
  readonly options: SelectOption[];
  readonly getValue?: (value: unknown) => string;
  readonly setValue?: (value: string) => unknown;
};

export const SelectField = ({ label, placeholder, options, getValue, setValue }: SelectFieldProps) => {
  const field = useFieldContext<unknown>();
  const isInvalid = field.state.meta.isTouched && !field.state.meta.isValid;
  const currentValue = getValue ? getValue(field.state.value) : (field.state.value as string);
  const selectedLabel = options.find((o) => o.value === currentValue)?.label;

  return (
    <Field data-invalid={isInvalid}>
      <FieldLabel htmlFor={field.name}>{label}</FieldLabel>
      <Select
        name={field.name}
        value={currentValue}
        onValueChange={(value) => {
          const v = value ?? "";
          field.handleChange(setValue ? setValue(v) : v);
        }}
      >
        <SelectTrigger
          id={field.name}
          className="w-full"
          aria-invalid={isInvalid}
        >
          <SelectValue placeholder={placeholder}>
            {selectedLabel}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            {options.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectGroup>
        </SelectContent>
      </Select>
      {isInvalid && <FieldError errors={field.state.meta.errors} />}
    </Field>
  );
};
