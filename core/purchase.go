package core

import (
	"context"
	"time"
)

const (
	PurchaseOrderErrNotFound   = AppError("purchase order not found")
	PurchaseReceiptErrNotFound = AppError("purchase receipt not found")
)

type PurchaseOrderStatus string

const (
	PurchaseOrderStatusDraft             PurchaseOrderStatus = "draft"
	PurchaseOrderStatusApproved          PurchaseOrderStatus = "approved"
	PurchaseOrderStatusPartiallyReceived PurchaseOrderStatus = "partially_received"
	PurchaseOrderStatusReceived          PurchaseOrderStatus = "received"
	PurchaseOrderStatusCancelled         PurchaseOrderStatus = "cancelled"
)

type PurchaseOrder struct {
	ID           string
	PONumber     string
	SupplierName string
	Status       PurchaseOrderStatus
	OrderedAt    *time.Time
	ApprovedAt   *time.Time
	ReceivedAt   *time.Time
	CreatedAt    time.Time
	UpdatedAt    time.Time
}

type PurchaseOrderLine struct {
	ID               string
	PurchaseOrderID  string
	VariantID        string
	OrderedQuantity  Quantity
	ReceivedQuantity Quantity
	UnitCost         Money
}

type PurchaseReceipt struct {
	ID              string
	PurchaseOrderID string
	ReceivedAt      time.Time
	Note            string
	CreatedAt       time.Time
}

type PurchaseReceiptLine struct {
	ID                  string
	PurchaseReceiptID   string
	PurchaseOrderLineID string
	VariantID           string
	Quantity            Quantity
	UnitCost            Money
}

type PurchaseOrderFilter struct {
	Limit  int
	Offset int
	Status PurchaseOrderStatus
	Query  string
}

type PurchaseOrderDetail struct {
	Order    PurchaseOrder
	Lines    []PurchaseOrderLine
	Receipts []PurchaseReceiptDetail
}

type PurchaseReceiptDetail struct {
	Receipt PurchaseReceipt
	Lines   []PurchaseReceiptLine
}

type PurchasingRepository interface {
	FindPurchaseOrders(ctx context.Context, filter PurchaseOrderFilter) ([]PurchaseOrder, error)
	FindPurchaseOrderByID(ctx context.Context, id string) (*PurchaseOrder, error)
	FindPurchaseOrderDetailByID(ctx context.Context, id string) (*PurchaseOrderDetail, error)
	SavePurchaseOrder(ctx context.Context, order *PurchaseOrder) error
	ReplacePurchaseOrderLines(ctx context.Context, purchaseOrderID string, lines []PurchaseOrderLine) error
	SavePurchaseReceipt(ctx context.Context, receipt *PurchaseReceipt, lines []PurchaseReceiptLine) error
}
