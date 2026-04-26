import { queryOptions } from "@tanstack/react-query";
import { productApi } from "./api";
import type { GetProductsInput } from "./types";

export const productQueries = {
  all: (input?: Partial<GetProductsInput>) =>
    queryOptions({
      queryKey: ["products", input],
      queryFn: () =>
        productApi.getAllProducts({
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 20,
          categoryId: input?.categoryId ?? "",
          query: input?.query ?? "",
          includeArchived: input?.includeArchived ?? false,
        }),
    }),

  detail: (id: string) =>
    queryOptions({
      queryKey: ["products", id],
      queryFn: () => productApi.getProductById({ id }),
      enabled: !!id,
    }),
};
