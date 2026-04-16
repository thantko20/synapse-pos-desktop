package product

import (
	"context"
	"database/sql"
	unitfeature "synapse-pos-desktop/internal/unit"
)

type ProductApi struct {
	ctx context.Context
	svc *ProductService
}

func NewProductApi(db *sql.DB) *ProductApi {
	repo := NewProductRepository(db)
	unitRepo := unitfeature.NewUnitRepository(db)
	svc := NewProductService(repo, unitRepo)
	return &ProductApi{svc: svc}
}

func (a *ProductApi) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *ProductApi) GetAllProducts(input GetProductsInput) (*GetProductsResult, error) {
	return a.svc.GetAllProducts(a.ctx, input)
}

func (a *ProductApi) GetProductById(input GetProductByIdInput) (*Product, error) {
	return a.svc.GetProductById(a.ctx, input.ID)
}

func (a *ProductApi) CreateProduct(input CreateProductInput) (*Product, error) {
	return a.svc.CreateProduct(a.ctx, input)
}

func (a *ProductApi) UpdateProduct(input UpdateProductInput) (*Product, error) {
	return a.svc.UpdateProduct(a.ctx, input)
}

func (a *ProductApi) ArchiveProduct(input GetProductByIdInput) error {
	return a.svc.ArchiveProduct(a.ctx, input.ID)
}
