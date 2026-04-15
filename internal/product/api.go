package product

import (
	"context"
	"database/sql"
)

type ProductApi struct {
	ctx context.Context
	svc *ProductService
}

func NewProductApi(db *sql.DB) *ProductApi {
	repo := NewProductRepository(db)
	svc := NewProductService(repo)
	return &ProductApi{svc: svc}
}

func (a *ProductApi) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *ProductApi) GetAllProducts(input GetProductsInput) ([]Product, error) {
	return a.svc.GetAllProducts(a.ctx, input)
}

func (a *ProductApi) GetProductById(id string) (*Product, error) {
	return a.svc.GetProductById(a.ctx, id)
}

func (a *ProductApi) CreateProduct(input CreateProductInput) (*Product, error) {
	return a.svc.CreateProduct(a.ctx, input)
}
