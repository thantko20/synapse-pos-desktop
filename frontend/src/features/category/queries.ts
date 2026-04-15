import { queryOptions } from "@tanstack/react-query"
import { categoryApi } from "./api"
import type { GetAllCategoriesInput } from "./types"

export const categoryQueries = {
  all: (input?: Partial<GetAllCategoriesInput>) =>
    queryOptions({
      queryKey: ["categories", input],
      queryFn: () =>
        categoryApi.getAllCategories({
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 100,
          includeArchived: input?.includeArchived ?? false,
        }),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: ["categories", id],
      queryFn: () => categoryApi.getCategoryById({ id }),
    }),
}