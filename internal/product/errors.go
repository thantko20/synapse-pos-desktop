package product

import "errors"

var (
	ProductErrNameExists    = errors.New("product name already exists")
	ProductErrNotFound      = errors.New("product not found")
	ProductErrVariantMin    = errors.New("product must have at least one variant")
	VariantErrNotFound      = errors.New("product variant not found")
	VariantErrSKUExists     = errors.New("product variant sku already exists")
	VariantErrBarcodeExists = errors.New("product variant barcode already exists")
	VariantErrUnitMin       = errors.New("product variant must have at least one unit")
	VariantErrUnitDefault   = errors.New("product variant must have exactly one default unit")
	VariantErrUnitRoot      = errors.New("product variant must have exactly one base unit")
	VariantErrUnitDuplicate = errors.New("product variant units must be unique")
	VariantErrUnitCycle     = errors.New("product variant unit hierarchy contains a cycle")
	VariantErrUnitParent    = errors.New("product variant unit parent must exist in the same hierarchy")
	VariantErrUnitInactive  = errors.New("product variant units must reference active units")
	VariantErrUnitBaseEdit  = errors.New("changing a variant base unit is not supported")
)
