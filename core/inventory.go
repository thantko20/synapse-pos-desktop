package core

import (
	"context"
	"time"
)

const (
	InventoryBalanceErrNotFound = AppError("inventory balance not found")
)

type InventoryMovementType string

const (
	InventoryMovementTypePurchaseReceived InventoryMovementType = "purchase_received"
	InventoryMovementTypeSaleCompleted    InventoryMovementType = "sale_completed"
	InventoryMovementTypeSaleVoided       InventoryMovementType = "sale_voided"
	InventoryMovementTypeSaleRefunded     InventoryMovementType = "sale_refunded"
	InventoryMovementTypeStockAdjusted    InventoryMovementType = "stock_adjusted"
)

type InventoryMovement struct {
	ID            string
	VariantID     string
	LocationCode  string
	Type          InventoryMovementType
	QuantityDelta Quantity
	UnitCost      Money
	ReasonCode    string
	ReasonNote    string
	ReferenceType string
	ReferenceID   string
	OccurredAt    time.Time
	CreatedAt     time.Time
}

type InventoryBalance struct {
	VariantID    string
	LocationCode string
	OnHand       Quantity
	UpdatedAt    time.Time
}

type InventoryMovementFilter struct {
	VariantID     string
	LocationCode  string
	ReferenceType string
	ReferenceID   string
	From          *time.Time
	To            *time.Time
}

type InventoryRepository interface {
	FindBalance(ctx context.Context, variantID string, locationCode string) (*InventoryBalance, error)
	FindBalances(ctx context.Context, locationCode string, variantIDs []string) ([]InventoryBalance, error)
	FindMovements(ctx context.Context, filter InventoryMovementFilter) ([]InventoryMovement, error)
	AppendMovements(ctx context.Context, movements []InventoryMovement) error
	ReplaceBalance(ctx context.Context, balance *InventoryBalance) error
}
