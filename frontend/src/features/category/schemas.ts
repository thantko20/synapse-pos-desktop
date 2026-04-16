import * as v from "valibot"

export const CategoryFormSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required.")),
  description: v.string(),
})

export type CategoryFormValues = v.InferInput<typeof CategoryFormSchema>
