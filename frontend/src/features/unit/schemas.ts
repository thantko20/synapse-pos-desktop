import * as v from "valibot";

export const UnitFormSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Unit name is required.")),
  symbol: v.string(),
});
