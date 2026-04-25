import { createFormHook } from "@tanstack/react-form";
import { fieldContext, formContext } from "./form-context";
import { lazy } from "react";

export const { useAppForm, withFieldGroup, withForm } = createFormHook({
  fieldComponents: {
    TextField: lazy(() =>
      import("#/components/ui/text-field").then((mod) => ({
        default: mod.TextField,
      }))
    ),
    SelectField: lazy(() =>
      import("#/components/ui/select-field").then((mod) => ({
        default: mod.SelectField,
      }))
    ),
  },
  formComponents: {},
  fieldContext,
  formContext,
});
