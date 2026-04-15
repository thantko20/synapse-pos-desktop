package core

import (
	"context"
	"time"
)

const (
	PriceListErrNotFound = AppError("price list not found")
	PriceErrNotFound     = AppError("variant price not found")
)

type PriceList struct {
	Code      string
	Name      string
	IsDefault bool
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type VariantPrice struct {
	ID            string
	VariantID     string
	PriceListCode string
	Amount        Money
	ValidFrom     time.Time
	ValidTo       *time.Time
	CreatedAt     time.Time
}

type PriceFilter struct {
	VariantID     string
	PriceListCode string
	At            time.Time
}

type PricingRepository interface {
	ListPriceLists(ctx context.Context) ([]PriceList, error)
	GetPriceListByCode(ctx context.Context, code string) (*PriceList, error)
	SavePriceList(ctx context.Context, priceList *PriceList) error

	ListVariantPrices(ctx context.Context, filter PriceFilter) ([]VariantPrice, error)
	GetActiveVariantPrice(ctx context.Context, variantID string, priceListCode string, at time.Time) (*VariantPrice, error)
	SaveVariantPrice(ctx context.Context, price *VariantPrice) error
}
