package category

import "errors"

var (
	CategoryErrNameExists = errors.New("category name already exists")
	CategoryErrNotFound   = errors.New("category not found")
)
