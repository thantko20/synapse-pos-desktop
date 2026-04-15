package product

import (
	"synapse-pos-desktop/internal/shared"
	"time"
)

type Product struct {
	ID          string
	Name        string
	Description string
	CategoryID  string
	Category    *ProductCategory
	IsActive    bool
	CreatedAt   time.Time
	UpdatedAt   time.Time
}

type ProductCategory struct {
	ID          string
	Name        string
	Description string
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
	ID              string
	Limit           int
	Offset          int
	Query           string
	CategoryID      string
	Name            string
	IncludeArchived bool
}

type VariantFilter struct {
	Limit           int
	Offset          int
	ProductID       string
	Query           string
	IncludeArchived bool
}

type GetProductsInput struct {
	CategoryID string `json:"categoryId"`
	Page       int    `json:"page"`
	PageSize   int    `json:"pageSize"`
}

type CreateProductInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
	CategoryID  string `json:"categoryId"`
	IsActive    bool   `json:"isActive"`
}

func (i *CreateProductInput) validate() error {
	if len(i.Name) == 0 {
		return shared.ValidationErr
	}
	return nil
}
