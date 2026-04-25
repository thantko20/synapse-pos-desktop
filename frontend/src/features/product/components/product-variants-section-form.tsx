import { withForm } from "#/hooks/form";

export const ProductVariantsSectionForm = withForm({
  defaultValues: {
    hasVariants: false,
  },
  props: {
    title: "Product Variants",
  },
  render: function Render({ form }) {
    return (
      <div className="flex flex-col gap-6 lg:pl-8">
        <form.Subscribe
          selector={(state) => state.values.hasVariants}
          children={(hasVariants) => {
            return <div>{hasVariants ? "Has Variants" : "No Variants"}</div>;
          }}
        />
      </div>
    );
  },
});
