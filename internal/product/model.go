package product

import (
	"strings"
	"synapse-pos-desktop/internal/shared"
	"time"
)

type Product struct {
	ID           string           `json:"id"`
	Name         string           `json:"name"`
	Description  string           `json:"description"`
	CategoryID   string           `json:"categoryId"`
	Category     *ProductCategory `json:"category,omitempty"`
	Brand        string           `json:"brand"`
	Notes        string           `json:"notes"`
	VariantCount int              `json:"variantCount"`
	Variants     []ProductVariant `json:"variants,omitempty"`
	IsActive     bool             `json:"isActive"`
	CreatedAt    time.Time        `json:"createdAt"`
	UpdatedAt    time.Time        `json:"updatedAt"`
}

type ProductCategory struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

type ProductVariant struct {
	ID             string    `json:"id"`
	ProductID      string    `json:"productId"`
	Name           string    `json:"name"`
	SKU            string    `json:"sku"`
	Barcode        string    `json:"barcode"`
	UnitName       string    `json:"unitName"`
	ReorderPoint   int       `json:"reorderPoint"`
	AlertThreshold int       `json:"alertThreshold"`
	IsActive       bool      `json:"isActive"`
	CreatedAt      time.Time `json:"createdAt"`
	UpdatedAt      time.Time `json:"updatedAt"`
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

type GetProductsInput struct {
	CategoryID      string `json:"categoryId"`
	Query           string `json:"query"`
	Page            int    `json:"page"`
	PageSize        int    `json:"pageSize"`
	IncludeArchived bool   `json:"includeArchived"`
}

type GetProductByIdInput struct {
	ID string `json:"id"`
}

type CreateProductVariantInput struct {
	Name           string `json:"name"`
	SKU            string `json:"sku"`
	Barcode        string `json:"barcode"`
	UnitName       string `json:"unitName"`
	ReorderPoint   int    `json:"reorderPoint"`
	AlertThreshold int    `json:"alertThreshold"`
}

func (i *CreateProductVariantInput) validate() error {
	if strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	if i.ReorderPoint < 0 || i.AlertThreshold < 0 {
		return shared.ValidationErr
	}

	return nil
}

type CreateProductInput struct {
	Name        string                      `json:"name"`
	Description string                      `json:"description"`
	CategoryID  string                      `json:"categoryId"`
	Brand       string                      `json:"brand"`
	Notes       string                      `json:"notes"`
	Variants    []CreateProductVariantInput `json:"variants"`
}

func (i *CreateProductInput) validate() error {
	if strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	for idx := range i.Variants {
		if err := i.Variants[idx].validate(); err != nil {
			return err
		}
	}

	return nil
}

type UpdateProductVariantInput struct {
	ID             string `json:"id"`
	Name           string `json:"name"`
	SKU            string `json:"sku"`
	Barcode        string `json:"barcode"`
	UnitName       string `json:"unitName"`
	ReorderPoint   int    `json:"reorderPoint"`
	AlertThreshold int    `json:"alertThreshold"`
}

func (i *UpdateProductVariantInput) validate() error {
	if strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	if i.ReorderPoint < 0 || i.AlertThreshold < 0 {
		return shared.ValidationErr
	}

	return nil
}

type UpdateProductInput struct {
	ID          string                      `json:"id"`
	Name        string                      `json:"name"`
	Description string                      `json:"description"`
	CategoryID  string                      `json:"categoryId"`
	Brand       string                      `json:"brand"`
	Notes       string                      `json:"notes"`
	Variants    []UpdateProductVariantInput `json:"variants"`
}

func (i *UpdateProductInput) validate() error {
	if strings.TrimSpace(i.ID) == "" || strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	for idx := range i.Variants {
		if err := i.Variants[idx].validate(); err != nil {
			return err
		}
	}

	return nil
}

type GetProductsResult struct {
	Items    []Product `json:"items"`
	Total    int       `json:"total"`
	Page     int       `json:"page"`
	PageSize int       `json:"pageSize"`
}
