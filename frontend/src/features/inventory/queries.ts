import { queryOptions } from "@tanstack/react-query";
import { inventoryApi } from "./api";
import type { GetMovementsInput, GetLowStockInput } from "./types";

export const inventoryQueries = {
  balance: (variantId: string) =>
    queryOptions({
      queryKey: ["inventory", "balance", variantId],
      queryFn: () =>
        inventoryApi.getInventoryBalance({ productVariantId: variantId }),
      enabled: !!variantId,
    }),

  balancesByProduct: (productId: string) =>
    queryOptions({
      queryKey: ["inventory", "balances", "product", productId],
      queryFn: () => inventoryApi.getBalancesByProductID({ productId }),
      enabled: !!productId,
    }),

  movements: (
    input: Partial<GetMovementsInput> & { productVariantId: string },
  ) =>
    queryOptions({
      queryKey: ["inventory", "movements", input],
      queryFn: () =>
        inventoryApi.getInventoryMovements({
          productVariantId: input.productVariantId,
          productId: input.productId ?? "",
          page: input.page ?? 1,
          pageSize: input.pageSize ?? 20,
        }),
      enabled: !!input.productVariantId,
    }),

  movementsByProduct: (
    input: Partial<GetMovementsInput> & { productId: string },
  ) =>
    queryOptions({
      queryKey: ["inventory", "movements", "product", input],
      queryFn: () =>
        inventoryApi.getMovementsByProductID({
          productId: input.productId,
          productVariantId: input.productVariantId ?? "",
          page: input.page ?? 1,
          pageSize: input.pageSize ?? 20,
        }),
      enabled: !!input.productId,
    }),

  lowStock: (input?: Partial<GetLowStockInput>) =>
    queryOptions({
      queryKey: ["inventory", "lowStock", input],
      queryFn: () =>
        inventoryApi.getLowStockProducts({
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 20,
        }),
    }),
};
