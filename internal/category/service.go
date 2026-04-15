package category

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type CategoryService struct {
	repo *CategoryRepository
}

func NewCategoryService(repo *CategoryRepository) *CategoryService {
	return &CategoryService{repo}
}

func (s *CategoryService) GetAllCategories(ctx context.Context, input GetAllCategoriesInput) (*GetAllCategoriesResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.Page == 0 {
		input.Page = 1
	}

	filter := CategoryFilter{
		Limit:           input.PageSize,
		Offset:          (input.Page - 1) * input.PageSize,
		IncludeArchived: input.IncludeArchived,
	}

	categories, err := s.repo.GetAllCategories(ctx, filter)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountCategories(ctx, input.IncludeArchived)
	if err != nil {
		return nil, err
	}

	return &GetAllCategoriesResult{
		Items:    categories,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
	}, nil
}

func (s *CategoryService) GetCategoryById(ctx context.Context, id string) (*Category, error) {
	return s.repo.GetCategoryById(ctx, id)
}

func (s *CategoryService) CreateCategory(ctx context.Context, input CreateCategoryInput) (*Category, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetOneCategory(ctx, CategoryFilter{Name: input.Name})
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, CategoryErrNameExists
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	category := &Category{
		ID:          id.String(),
		Name:        input.Name,
		Description: input.Description,
		IsActive:    true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	err = s.repo.CreateCategory(ctx, category)
	if err != nil {
		return nil, err
	}

	return category, nil
}

func (s *CategoryService) UpdateCategory(ctx context.Context, input UpdateCategoryInput) (*Category, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetCategoryById(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, CategoryErrNotFound
	}

	duplicate, err := s.repo.GetOneCategory(ctx, CategoryFilter{Name: input.Name})
	if err != nil {
		return nil, err
	}
	if duplicate != nil && duplicate.ID != input.ID {
		return nil, CategoryErrNameExists
	}

	existing.Name = input.Name
	existing.Description = input.Description
	existing.UpdatedAt = time.Now()

	err = s.repo.UpdateCategory(ctx, existing)
	if err != nil {
		return nil, err
	}

	return existing, nil
}

func (s *CategoryService) ArchiveCategory(ctx context.Context, id string) error {
	existing, err := s.repo.GetCategoryById(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return CategoryErrNotFound
	}

	return s.repo.ArchiveCategory(ctx, id)
}
