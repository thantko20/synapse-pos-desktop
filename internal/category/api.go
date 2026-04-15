package category

import (
	"context"
	"database/sql"
)

type CategoryApi struct {
	ctx context.Context
	svc *CategoryService
}

func NewCategoryApi(db *sql.DB) *CategoryApi {
	repo := NewCategoryRepository(db)
	svc := NewCategoryService(repo)
	return &CategoryApi{svc: svc}
}

func (a *CategoryApi) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *CategoryApi) GetAllCategories(input GetAllCategoriesInput) (*GetAllCategoriesResult, error) {
	return a.svc.GetAllCategories(a.ctx, input)
}

func (a *CategoryApi) GetCategoryById(input GetCategoryByIdInput) (*Category, error) {
	return a.svc.GetCategoryById(a.ctx, input.ID)
}

func (a *CategoryApi) CreateCategory(input CreateCategoryInput) (*Category, error) {
	return a.svc.CreateCategory(a.ctx, input)
}

func (a *CategoryApi) UpdateCategory(input UpdateCategoryInput) (*Category, error) {
	return a.svc.UpdateCategory(a.ctx, input)
}

func (a *CategoryApi) ArchiveCategory(input GetCategoryByIdInput) error {
	return a.svc.ArchiveCategory(a.ctx, input.ID)
}
