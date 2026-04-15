package core

import (
	"context"
	"time"
)

type CatalogItem struct {
	ProductID      string
	ProductName    string
	Description    string
	CategoryID     string
	CategoryName   string
	VariantID      string
	VariantName    string
	SKU            string
	Barcode        string
	UnitName       string
	PriceListCode  string
	PriceAmount    Money
	ProductActive  bool
	VariantActive  bool
	EffectivePrice *time.Time
}

type CatalogItemFilter struct {
	Limit           int
	Offset          int
	Query           string
	CategoryID      string
	PriceListCode   string
	At              time.Time
	IncludeArchived bool
}

type CatalogReader interface {
	ListCatalogItems(ctx context.Context, filter CatalogItemFilter) ([]CatalogItem, error)
	GetCatalogItem(ctx context.Context, variantID string, priceListCode string, at time.Time) (*CatalogItem, error)
}
