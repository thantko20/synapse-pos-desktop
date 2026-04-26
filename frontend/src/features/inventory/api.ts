import {
  GetInventoryBalance,
  GetBalancesByProductID,
  GetInventoryMovements,
  GetMovementsByProductID,
  GetLowStockProducts,
} from "../../../wailsjs/go/inventory/InventoryApi";

export const inventoryApi = {
  getInventoryBalance: GetInventoryBalance,
  getBalancesByProductID: GetBalancesByProductID,
  getInventoryMovements: GetInventoryMovements,
  getMovementsByProductID: GetMovementsByProductID,
  getLowStockProducts: GetLowStockProducts,
};
