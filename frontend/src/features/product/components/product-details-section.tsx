import { withForm } from "#/hooks/form";
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "#/components/ui/field";
import { Textarea } from "#/components/ui/textarea";
import type { ProductFormValues } from "../schemas";

interface CategoryOption {
  value: string;
  label: string;
}

export const ProductDetailsSection = withForm({
  defaultValues: {} as ProductFormValues,
  props: {
    categories: [] as CategoryOption[],
  },
  render: function Render({ form, categories }) {
    return (
      <div className="flex flex-col gap-6 lg:border-r lg:pr-8">
        <div className="flex flex-col gap-1">
          <h2 className="font-heading text-lg font-semibold">
            Product Details
          </h2>
          <p className="text-sm text-muted-foreground">
            Core identity and categorization.
          </p>
        </div>

        <FieldGroup>
          <form.AppField
            name="name"
            listeners={{
              onChange: ({ value }) => {
                const values = form.state.values;
                if (!values.hasVariants && values.variants[0]) {
                  form.setFieldValue("variants[0].name", value);
                }
              },
            }}
            children={(field) => (
              <field.TextField
                label="Name"
                placeholder="Cold brew concentrate"
              />
            )}
          />
          <form.AppField
            name="categoryId"
            children={(field) => (
              <field.SelectField
                label="Category"
                placeholder="Uncategorized"
                options={[{ value: "", label: "Uncategorized" }, ...categories]}
              />
            )}
          />
          <form.AppField
            name="brand"
            children={(field) => (
              <field.TextField label="Brand" placeholder="Optional brand" />
            )}
          />
          <form.Field
            name="description"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="md:col-span-2">
                  <FieldLabel htmlFor="product-description">
                    Description
                  </FieldLabel>
                  <Textarea
                    id="product-description"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Customer-facing description"
                    className="min-h-20"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="notes"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;
              return (
                <Field data-invalid={isInvalid} className="md:col-span-2">
                  <FieldLabel htmlFor="product-notes">Notes</FieldLabel>
                  <Textarea
                    id="product-notes"
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="Internal notes for staff"
                    className="min-h-20"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </div>
    );
  },
});
