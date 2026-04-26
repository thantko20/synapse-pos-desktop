import { inventory } from "../../../wailsjs/go/models";

export type InventoryMovement = inventory.InventoryMovement;
export type InventoryBalance = inventory.InventoryBalance;
export type LowStockVariant = inventory.LowStockVariant;
export type GetMovementsResult = inventory.GetMovementsResult;
export type GetLowStockResult = inventory.GetLowStockResult;
export class GetMovementsInput extends inventory.GetMovementsInput {}
export class GetLowStockInput extends inventory.GetLowStockInput {}
export class GetInventoryBalanceInput
  extends inventory.GetInventoryBalanceInput {}
export class GetBalancesByProductIDInput
  extends inventory.GetBalancesByProductIDInput {}
