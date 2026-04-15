package product

import "errors"

var (
	ProductErrNameExists    = errors.New("product name already exists")
	ProductErrNotFound      = errors.New("product not found")
	ProductErrVariantMin    = errors.New("product must have at least one variant")
	VariantErrNotFound      = errors.New("product variant not found")
	VariantErrSKUExists     = errors.New("product variant sku already exists")
	VariantErrBarcodeExists = errors.New("product variant barcode already exists")
)
