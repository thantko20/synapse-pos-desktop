package product

import (
	"context"
	"time"

	"github.com/google/uuid"
)

type ProductService struct {
	repo *ProductRepository
}

func NewProductService(repo *ProductRepository) *ProductService {
	return &ProductService{
		repo: repo,
	}
}

func (s *ProductService) GetAllProducts(ctx context.Context, input GetProductsInput) ([]Product, error) {
	productFilter := ProductFilter{
		Limit:      input.PageSize,
		Offset:     (input.Page - 1) * input.PageSize,
		CategoryID: input.CategoryID,
	}

	return s.repo.GetProducts(ctx, productFilter)
}

func (s *ProductService) GetProductById(ctx context.Context, id string) (*Product, error) {
	return s.repo.GetProductById(ctx, id)
}

func (s *ProductService) CreateProduct(ctx context.Context, input CreateProductInput) (*Product, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}

	product, err := s.repo.GetOneProduct(ctx, ProductFilter{
		Name: input.Name,
	})

	if err != nil {
		return nil, err
	}

	if product != nil {
		return nil, ProductErrNameExists
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	now := time.Now()

	product = &Product{
		ID:          id.String(),
		Name:        input.Name,
		Description: input.Description,
		CategoryID:  input.CategoryID,
		IsActive:    input.IsActive,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	err = s.repo.CreateProduct(ctx, product)

	if err != nil {
		return nil, err
	}

	return product, err
}
