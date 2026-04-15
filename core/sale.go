package core

import (
	"context"
	"time"
)

const (
	SaleErrNotFound = AppError("sale not found")
)

type SaleStatus string

const (
	SaleStatusDraft     SaleStatus = "draft"
	SaleStatusCompleted SaleStatus = "completed"
	SaleStatusVoided    SaleStatus = "voided"
	SaleStatusRefunded  SaleStatus = "refunded"
)

type PaymentMethod string

const (
	PaymentMethodCash   PaymentMethod = "cash"
	PaymentMethodCard   PaymentMethod = "card"
	PaymentMethodWallet PaymentMethod = "wallet"
)

type Sale struct {
	ID            string
	SaleNumber    string
	Status        SaleStatus
	PriceListCode string
	Subtotal      Money
	Tax           Money
	Total         Money
	PaymentMethod PaymentMethod
	PaidAmount    Money
	ChangeAmount  Money
	CompletedAt   *time.Time
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

type SaleLine struct {
	ID                  string
	SaleID              string
	VariantID           string
	Quantity            Quantity
	UnitPrice           Money
	Subtotal            Money
	Tax                 Money
	Total               Money
	SnapshotProductName string
	SnapshotVariantName string
	SnapshotSKU         string
}

type SaleFilter struct {
	Limit  int
	Offset int
	Status SaleStatus
	From   *time.Time
	To     *time.Time
}

type SaleDetail struct {
	Sale     Sale
	Lines    []SaleLine
	Payments []SalePayment
}

type SalePayment struct {
	ID            string
	SaleID        string
	Method        PaymentMethod
	Amount        Money
	ReferenceCode string
	PaidAt        time.Time
}

type SalesRepository interface {
	FindSales(ctx context.Context, filter SaleFilter) ([]Sale, error)
	FindSaleByID(ctx context.Context, id string) (*Sale, error)
	FindSaleDetailByID(ctx context.Context, id string) (*SaleDetail, error)
	SaveSale(ctx context.Context, sale *Sale) error
	ReplaceSaleLines(ctx context.Context, saleID string, lines []SaleLine) error
	ReplaceSalePayments(ctx context.Context, saleID string, payments []SalePayment) error
}
