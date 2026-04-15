package product

import "errors"

var (
	ProductErrNameExists = errors.New("product name already exists")
	ProductErrNotFound   = errors.New("product not found")
	VariantErrNotFound   = errors.New("product variant not found")
)
