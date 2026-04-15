package core

import (
	"context"
	"time"
)

const (
	ProductErrNotFound = AppError("product not found")
	VariantErrNotFound = AppError("product variant not found")
)

type Product struct {
	ID          string
	Name        string
	Description string
	CategoryID  string
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ProductVariant struct {
	ID        string
	ProductID string
	Name      string
	SKU       string
	Barcode   string
	UnitName  string
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type ProductFilter struct {
	Limit           int
	Offset          int
	Query           string
	CategoryID      string
	IncludeArchived bool
}

type VariantFilter struct {
	Limit           int
	Offset          int
	ProductID       string
	Query           string
	IncludeArchived bool
}

type ProductRepository interface {
	ListProducts(ctx context.Context, filter ProductFilter) ([]Product, error)
	GetProductByID(ctx context.Context, id string) (*Product, error)
	SaveProduct(ctx context.Context, product *Product) error
	ArchiveProduct(ctx context.Context, id string) error

	ListVariants(ctx context.Context, filter VariantFilter) ([]ProductVariant, error)
	GetVariantByID(ctx context.Context, id string) (*ProductVariant, error)
	SaveVariant(ctx context.Context, variant *ProductVariant) error
	ArchiveVariant(ctx context.Context, id string) error
}
