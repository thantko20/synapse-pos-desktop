package product

import (
	"context"
	"log"
	"strings"
	"time"

	"github.com/google/uuid"
)

type ProductService struct {
	repo *ProductRepository
}

func NewProductService(repo *ProductRepository) *ProductService {
	return &ProductService{repo: repo}
}

func (s *ProductService) GetAllProducts(ctx context.Context, input GetProductsInput) (*GetProductsResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.Page == 0 {
		input.Page = 1
	}

	filter := ProductFilter{
		Limit:           input.PageSize,
		Offset:          (input.Page - 1) * input.PageSize,
		CategoryID:      input.CategoryID,
		Query:           input.Query,
		IncludeArchived: input.IncludeArchived,
	}

	products, err := s.repo.GetProducts(ctx, filter)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountProducts(ctx, ProductFilter{
		CategoryID:      input.CategoryID,
		Query:           input.Query,
		IncludeArchived: input.IncludeArchived,
	})
	if err != nil {
		return nil, err
	}

	return &GetProductsResult{
		Items:    products,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
	}, nil
}

func (s *ProductService) GetProductById(ctx context.Context, id string) (*Product, error) {
	return s.repo.GetProductById(ctx, id)
}

func (s *ProductService) CreateProduct(ctx context.Context, input CreateProductInput) (*Product, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}
	if len(input.Variants) == 0 {
		return nil, ProductErrVariantMin
	}

	existing, err := s.repo.GetOneProduct(ctx, ProductFilter{Name: strings.TrimSpace(input.Name)})
	if err != nil {
		log.Printf("failed to called repo.GetOneProduct() %s\n", err)
		return nil, err
	}
	if existing != nil {
		return nil, ProductErrNameExists
	}

	if err := s.validateVariantIdentifiers(ctx, toCreateVariantIdentifiers(input.Variants), nil); err != nil {
		return nil, err
	}

	productID, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	product := &Product{
		ID:          productID.String(),
		Name:        strings.TrimSpace(input.Name),
		Description: input.Description,
		CategoryID:  input.CategoryID,
		Brand:       input.Brand,
		Notes:       input.Notes,
		IsActive:    true,
		CreatedAt:   now,
		UpdatedAt:   now,
	}

	variants := make([]ProductVariant, 0, len(input.Variants))
	for _, item := range input.Variants {
		variantID, err := uuid.NewV7()
		if err != nil {
			return nil, err
		}

		variant := ProductVariant{
			ID:             variantID.String(),
			ProductID:      product.ID,
			Name:           strings.TrimSpace(item.Name),
			SKU:            strings.TrimSpace(item.SKU),
			Barcode:        strings.TrimSpace(item.Barcode),
			UnitName:       item.UnitName,
			ReorderPoint:   item.ReorderPoint,
			AlertThreshold: item.AlertThreshold,
			IsActive:       true,
			CreatedAt:      now,
			UpdatedAt:      now,
		}

		variants = append(variants, variant)
	}

	err = s.repo.CreateProductWithVariants(ctx, product, variants)
	if err != nil {
		return nil, err
	}

	product.Variants = variants
	product.VariantCount = len(variants)
	return product, nil
}

func (s *ProductService) UpdateProduct(ctx context.Context, input UpdateProductInput) (*Product, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}
	if len(input.Variants) == 0 {
		return nil, ProductErrVariantMin
	}

	existing, err := s.repo.GetProductById(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, ProductErrNotFound
	}

	duplicate, err := s.repo.GetOneProduct(ctx, ProductFilter{Name: strings.TrimSpace(input.Name)})
	if err != nil {
		return nil, err
	}
	if duplicate != nil && duplicate.ID != input.ID {
		return nil, ProductErrNameExists
	}

	if err := s.validateVariantIdentifiers(ctx, nil, input.Variants); err != nil {
		return nil, err
	}

	existing.Name = strings.TrimSpace(input.Name)
	existing.Description = input.Description
	existing.CategoryID = input.CategoryID
	existing.Brand = input.Brand
	existing.Notes = input.Notes
	existing.UpdatedAt = time.Now()

	currentByID := make(map[string]ProductVariant, len(existing.Variants))
	for _, variant := range existing.Variants {
		currentByID[variant.ID] = variant
	}

	createVariants := make([]ProductVariant, 0)
	updateVariants := make([]ProductVariant, 0)
	deleteVariantIDs := make([]string, 0)
	nextVariants := make([]ProductVariant, 0, len(input.Variants))
	seen := make(map[string]struct{}, len(input.Variants))
	for _, item := range input.Variants {
		if strings.TrimSpace(item.ID) == "" {
			variantID, err := uuid.NewV7()
			if err != nil {
				return nil, err
			}

			variant := ProductVariant{
				ID:             variantID.String(),
				ProductID:      existing.ID,
				Name:           strings.TrimSpace(item.Name),
				SKU:            strings.TrimSpace(item.SKU),
				Barcode:        strings.TrimSpace(item.Barcode),
				UnitName:       item.UnitName,
				ReorderPoint:   item.ReorderPoint,
				AlertThreshold: item.AlertThreshold,
				IsActive:       true,
				CreatedAt:      existing.UpdatedAt,
				UpdatedAt:      existing.UpdatedAt,
			}

			createVariants = append(createVariants, variant)
			nextVariants = append(nextVariants, variant)
			continue
		}

		stored, ok := currentByID[item.ID]
		if !ok {
			return nil, VariantErrNotFound
		}

		stored.Name = strings.TrimSpace(item.Name)
		stored.SKU = strings.TrimSpace(item.SKU)
		stored.Barcode = strings.TrimSpace(item.Barcode)
		stored.UnitName = item.UnitName
		stored.ReorderPoint = item.ReorderPoint
		stored.AlertThreshold = item.AlertThreshold
		stored.UpdatedAt = existing.UpdatedAt

		seen[stored.ID] = struct{}{}
		updateVariants = append(updateVariants, stored)
		nextVariants = append(nextVariants, stored)
	}

	for _, variant := range existing.Variants {
		if _, ok := seen[variant.ID]; ok {
			continue
		}
		deleteVariantIDs = append(deleteVariantIDs, variant.ID)
	}

	if err = s.repo.UpdateProductWithVariants(ctx, existing, createVariants, updateVariants, deleteVariantIDs); err != nil {
		return nil, err
	}

	existing.Variants = nextVariants
	existing.VariantCount = len(nextVariants)
	return existing, nil
}

func (s *ProductService) ArchiveProduct(ctx context.Context, id string) error {
	existing, err := s.repo.GetProductById(ctx, id)
	if err != nil {
		return err
	}
	if existing == nil {
		return ProductErrNotFound
	}

	return s.repo.ArchiveProduct(ctx, id)
}

func toCreateVariantIdentifiers(variants []CreateProductVariantInput) []UpdateProductVariantInput {
	result := make([]UpdateProductVariantInput, 0, len(variants))
	for _, variant := range variants {
		result = append(result, UpdateProductVariantInput{
			Name:           variant.Name,
			SKU:            variant.SKU,
			Barcode:        variant.Barcode,
			UnitName:       variant.UnitName,
			ReorderPoint:   variant.ReorderPoint,
			AlertThreshold: variant.AlertThreshold,
		})
	}
	return result
}

func (s *ProductService) validateVariantIdentifiers(ctx context.Context, createVariants []UpdateProductVariantInput, updateVariants []UpdateProductVariantInput) error {
	variants := updateVariants
	if variants == nil {
		variants = createVariants
	}

	seenSKU := map[string]string{}
	seenBarcode := map[string]string{}
	for _, variant := range variants {
		sku := strings.TrimSpace(variant.SKU)
		if sku != "" {
			if previousID, ok := seenSKU[sku]; ok && previousID != variant.ID {
				return VariantErrSKUExists
			}
			seenSKU[sku] = variant.ID

			exists, err := s.repo.VariantSKUExists(ctx, sku, variant.ID)
			if err != nil {
				return err
			}
			if exists {
				return VariantErrSKUExists
			}
		}

		barcode := strings.TrimSpace(variant.Barcode)
		if barcode != "" {
			if previousID, ok := seenBarcode[barcode]; ok && previousID != variant.ID {
				return VariantErrBarcodeExists
			}
			seenBarcode[barcode] = variant.ID

			exists, err := s.repo.VariantBarcodeExists(ctx, barcode, variant.ID)
			if err != nil {
				return err
			}
			if exists {
				return VariantErrBarcodeExists
			}
		}
	}

	return nil
}
