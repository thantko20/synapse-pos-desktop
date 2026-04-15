package core

import (
	"context"
	"time"
)

const (
	CategoryErrNotFound = AppError("category not found")
)

type Category struct {
	ID        string
	Name      string
	IsActive  bool
	CreatedAt time.Time
	UpdatedAt time.Time
}

type CategoryRepository interface {
	ListCategories(ctx context.Context) ([]Category, error)
	GetCategoryByID(ctx context.Context, id string) (*Category, error)
	SaveCategory(ctx context.Context, category *Category) error
	ArchiveCategory(ctx context.Context, id string) error
}
