package unit

import "errors"

var (
	UnitErrNameExists = errors.New("unit name already exists")
	UnitErrNotFound   = errors.New("unit not found")
)
