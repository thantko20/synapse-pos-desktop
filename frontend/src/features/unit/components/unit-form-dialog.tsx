import { useEffect } from "react";
import { useForm } from "@tanstack/react-form";

import { Button } from "#/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "#/components/ui/dialog";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Input } from "#/components/ui/input";
import { UnitFormSchema } from "../schemas";
import type { Unit } from "../types";

interface UnitFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  unit?: Unit | null;
  onSubmit: (value: { name: string; symbol: string }) => void;
  isPending: boolean;
}

export function UnitFormDialog({
  open,
  onOpenChange,
  unit,
  onSubmit,
  isPending,
}: UnitFormDialogProps) {
  const isEditing = !!unit;

  const form = useForm({
    defaultValues: {
      name: "",
      symbol: "",
    },
    validators: {
      onSubmit: UnitFormSchema,
    },
    onSubmit: ({ value }) => {
      onSubmit(value);
    },
  });

  useEffect(() => {
    if (open) {
      form.reset({
        name: unit?.name ?? "",
        symbol: unit?.symbol ?? "",
      });
    }
  }, [form, open, unit]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEditing ? "Edit Unit" : "New Unit"}</DialogTitle>
          <DialogDescription>
            {isEditing
              ? "Update the shared unit definition."
              : "Create a reusable unit for product variants."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="unit-form"
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            form.handleSubmit();
          }}
        >
          <FieldGroup>
            <form.Field
              name="name"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="unit-name">Name</FieldLabel>
                    <Input
                      id="unit-name"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="bottle"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />

            <form.Field
              name="symbol"
              children={(field) => {
                const isInvalid =
                  field.state.meta.isTouched && !field.state.meta.isValid;
                return (
                  <Field data-invalid={isInvalid}>
                    <FieldLabel htmlFor="unit-symbol">Symbol</FieldLabel>
                    <Input
                      id="unit-symbol"
                      name={field.name}
                      value={field.state.value}
                      onBlur={field.handleBlur}
                      onChange={(event) =>
                        field.handleChange(event.target.value)
                      }
                      aria-invalid={isInvalid}
                      placeholder="btl"
                    />
                    {isInvalid && (
                      <FieldError errors={field.state.meta.errors} />
                    )}
                  </Field>
                );
              }}
            />
          </FieldGroup>
        </form>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button type="submit" form="unit-form" disabled={isPending}>
            {isPending ? "Saving..." : isEditing ? "Update" : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
