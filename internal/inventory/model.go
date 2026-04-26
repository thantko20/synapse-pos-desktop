package inventory

import "time"

type MovementType string

const (
	MovementTypePurchase   MovementType = "purchase"
	MovementTypeSale       MovementType = "sale"
	MovementTypeAdjustment MovementType = "adjustment"
	MovementTypeReturn     MovementType = "return"
	MovementTypeTransfer   MovementType = "transfer"
)

type InventoryMovement struct {
	ID              string       `json:"id"`
	ProductID       string       `json:"productId"`
	ProductVariantID string      `json:"productVariantId"`
	MovementType    MovementType `json:"movementType"`
	Quantity        int          `json:"quantity"`
	ReferenceType   string       `json:"referenceType"`
	ReferenceID     string       `json:"referenceId"`
	Notes           string       `json:"notes"`
	CreatedAt       time.Time    `json:"createdAt"`
}

type InventoryBalance struct {
	ProductID        string    `json:"productId"`
	ProductVariantID string    `json:"productVariantId"`
	Quantity         int       `json:"quantity"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type GetMovementsInput struct {
	ProductID       string `json:"productId"`
	ProductVariantID string `json:"productVariantId"`
	Page            int    `json:"page"`
	PageSize        int    `json:"pageSize"`
}

type GetMovementsResult struct {
	Items    []InventoryMovement `json:"items"`
	Total    int                 `json:"total"`
	Page     int                 `json:"page"`
	PageSize int                 `json:"pageSize"`
}

type LowStockVariant struct {
	ProductID        string    `json:"productId"`
	ProductName      string    `json:"productName"`
	ProductVariantID string    `json:"productVariantId"`
	VariantName      string    `json:"variantName"`
	SKU              string    `json:"sku"`
	Quantity         int       `json:"quantity"`
	ReorderPoint     int       `json:"reorderPoint"`
	AlertThreshold   int       `json:"alertThreshold"`
	UpdatedAt        time.Time `json:"updatedAt"`
}

type GetLowStockInput struct {
	Page     int `json:"page"`
	PageSize int `json:"pageSize"`
}

type GetLowStockResult struct {
	Items    []LowStockVariant `json:"items"`
	Total    int               `json:"total"`
	Page     int               `json:"page"`
	PageSize int               `json:"pageSize"`
}
