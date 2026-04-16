import { queryOptions } from "@tanstack/react-query"
import { unitApi } from "./api"
import type { GetAllUnitsInput } from "./types"

export const unitQueries = {
  all: (input?: Partial<GetAllUnitsInput>) =>
    queryOptions({
      queryKey: ["units", input],
      queryFn: () =>
        unitApi.getAllUnits({
          page: input?.page ?? 1,
          pageSize: input?.pageSize ?? 100,
          includeArchived: input?.includeArchived ?? false,
        }),
    }),
}
