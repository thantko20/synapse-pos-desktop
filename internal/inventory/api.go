package inventory

import (
	"context"
	"database/sql"
)

type InventoryApi struct {
	ctx context.Context
	svc *InventoryService
}

func NewInventoryApi(db *sql.DB) *InventoryApi {
	repo := NewInventoryRepository(db)
	svc := NewInventoryService(repo)
	return &InventoryApi{svc: svc}
}

func (a *InventoryApi) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *InventoryApi) GetInventoryBalance(input GetInventoryBalanceInput) (*InventoryBalance, error) {
	return a.svc.GetInventoryBalance(a.ctx, input.ProductVariantID)
}

func (a *InventoryApi) GetBalancesByProductID(input GetBalancesByProductIDInput) ([]InventoryBalance, error) {
	return a.svc.GetBalancesByProductID(a.ctx, input.ProductID)
}

func (a *InventoryApi) GetInventoryMovements(input GetMovementsInput) (*GetMovementsResult, error) {
	return a.svc.GetInventoryMovements(a.ctx, input)
}

func (a *InventoryApi) GetMovementsByProductID(input GetMovementsInput) (*GetMovementsResult, error) {
	return a.svc.GetMovementsByProductID(a.ctx, input)
}

func (a *InventoryApi) GetLowStockProducts(input GetLowStockInput) (*GetLowStockResult, error) {
	return a.svc.GetLowStockProducts(a.ctx, input)
}

type GetInventoryBalanceInput struct {
	ProductVariantID string `json:"productVariantId"`
}

type GetBalancesByProductIDInput struct {
	ProductID string `json:"productId"`
}
