package product

import (
	"context"
	"log"
	"strings"
	unitfeature "synapse-pos-desktop/internal/unit"
	"time"

	"github.com/google/uuid"
)

type ProductService struct {
	repo     *ProductRepository
	unitRepo *unitfeature.UnitRepository
}

func NewProductService(repo *ProductRepository, unitRepo *unitfeature.UnitRepository) *ProductService {
	return &ProductService{repo: repo, unitRepo: unitRepo}
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
	activeUnits, err := s.loadActiveUnits(ctx, toCreateVariantUnitInputs(input.Variants))
	if err != nil {
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
			Units:          buildVariantUnits(product.ID, variantID.String(), now, item.Units, activeUnits),
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
	activeUnits, err := s.loadActiveUnits(ctx, toUpdateVariantUnitInputs(input.Variants))
	if err != nil {
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
				Units:          buildVariantUnits(existing.ID, variantID.String(), existing.UpdatedAt, toCreateVariantUnits(item.Units), activeUnits),
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
		stored.Units = buildVariantUnits(existing.ID, stored.ID, existing.UpdatedAt, toCreateVariantUnits(item.Units), activeUnits)
		stored.ReorderPoint = item.ReorderPoint
		stored.AlertThreshold = item.AlertThreshold
		stored.UpdatedAt = existing.UpdatedAt

		if baseUnitChanged(currentByID[item.ID].Units, stored.Units) {
			return nil, VariantErrUnitBaseEdit
		}

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
			Units:          toUpdateVariantUnitsFromCreate(variant.Units),
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

func (s *ProductService) loadActiveUnits(ctx context.Context, variants [][]CreateProductVariantUnitInput) (map[string]unitfeature.Unit, error) {
	ids := make([]string, 0)
	seen := map[string]struct{}{}
	for _, units := range variants {
		if err := validateVariantUnitHierarchy(units); err != nil {
			return nil, err
		}

		for _, item := range units {
			if _, ok := seen[item.UnitID]; ok {
				continue
			}
			seen[item.UnitID] = struct{}{}
			ids = append(ids, item.UnitID)
		}
	}

	activeUnits, err := s.unitRepo.GetActiveUnitsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	if len(activeUnits) != len(ids) {
		return nil, VariantErrUnitInactive
	}

	return activeUnits, nil
}

func validateVariantUnitHierarchy(units []CreateProductVariantUnitInput) error {
	if len(units) == 0 {
		return VariantErrUnitMin
	}

	seen := make(map[string]CreateProductVariantUnitInput, len(units))
	rootCount := 0
	defaultCount := 0
	for _, item := range units {
		if _, ok := seen[item.UnitID]; ok {
			return VariantErrUnitDuplicate
		}
		seen[item.UnitID] = item
		if strings.TrimSpace(item.ParentUnitID) == "" {
			rootCount++
		}
		if item.IsDefault {
			defaultCount++
		}
	}

	if rootCount != 1 {
		return VariantErrUnitRoot
	}
	if defaultCount != 1 {
		return VariantErrUnitDefault
	}

	for _, item := range units {
		parentID := strings.TrimSpace(item.ParentUnitID)
		if parentID == "" {
			continue
		}
		if parentID == item.UnitID {
			return VariantErrUnitCycle
		}
		if _, ok := seen[parentID]; !ok {
			return VariantErrUnitParent
		}
		if hasUnitCycle(item.UnitID, seen) {
			return VariantErrUnitCycle
		}
	}

	return nil
}

func hasUnitCycle(startUnitID string, units map[string]CreateProductVariantUnitInput) bool {
	visited := map[string]struct{}{}
	current := startUnitID
	for {
		item, ok := units[current]
		if !ok {
			return false
		}

		parentID := strings.TrimSpace(item.ParentUnitID)
		if parentID == "" {
			return false
		}
		if _, ok := visited[parentID]; ok {
			return true
		}
		visited[parentID] = struct{}{}
		current = parentID
	}
}

func buildVariantUnits(productID string, variantID string, now time.Time, inputs []CreateProductVariantUnitInput, activeUnits map[string]unitfeature.Unit) []ProductVariantUnit {
	result := make([]ProductVariantUnit, 0, len(inputs))
	for _, item := range inputs {
		id := uuid.Must(uuid.NewV7())
		unit := activeUnits[item.UnitID]
		result = append(result, ProductVariantUnit{
			ID:               id.String(),
			ProductVariantID: variantID,
			UnitID:           item.UnitID,
			UnitName:         unit.Name,
			UnitSymbol:       unit.Symbol,
			ParentUnitID:     strings.TrimSpace(item.ParentUnitID),
			FactorToParent:   item.FactorToParent,
			IsDefault:        item.IsDefault,
			IsActive:         true,
			CreatedAt:        now,
			UpdatedAt:        now,
		})
	}

	return result
}

func toCreateVariantUnitInputs(variants []CreateProductVariantInput) [][]CreateProductVariantUnitInput {
	result := make([][]CreateProductVariantUnitInput, 0, len(variants))
	for _, variant := range variants {
		result = append(result, variant.Units)
	}

	return result
}

func toUpdateVariantUnitInputs(variants []UpdateProductVariantInput) [][]CreateProductVariantUnitInput {
	result := make([][]CreateProductVariantUnitInput, 0, len(variants))
	for _, variant := range variants {
		result = append(result, toCreateVariantUnits(variant.Units))
	}

	return result
}

func toCreateVariantUnits(units []UpdateProductVariantUnitInput) []CreateProductVariantUnitInput {
	result := make([]CreateProductVariantUnitInput, 0, len(units))
	for _, item := range units {
		result = append(result, CreateProductVariantUnitInput{
			UnitID:         item.UnitID,
			ParentUnitID:   item.ParentUnitID,
			FactorToParent: item.FactorToParent,
			IsDefault:      item.IsDefault,
		})
	}

	return result
}

func toUpdateVariantUnits(units []ProductVariantUnit) []UpdateProductVariantUnitInput {
	result := make([]UpdateProductVariantUnitInput, 0, len(units))
	for _, item := range units {
		result = append(result, UpdateProductVariantUnitInput{
			UnitID:         item.UnitID,
			ParentUnitID:   item.ParentUnitID,
			FactorToParent: item.FactorToParent,
			IsDefault:      item.IsDefault,
		})
	}

	return result
}

func toUpdateVariantUnitsFromCreate(units []CreateProductVariantUnitInput) []UpdateProductVariantUnitInput {
	result := make([]UpdateProductVariantUnitInput, 0, len(units))
	for _, item := range units {
		result = append(result, UpdateProductVariantUnitInput{
			UnitID:         item.UnitID,
			ParentUnitID:   item.ParentUnitID,
			FactorToParent: item.FactorToParent,
			IsDefault:      item.IsDefault,
		})
	}

	return result
}

func baseUnitChanged(current []ProductVariantUnit, next []ProductVariantUnit) bool {
	return rootUnitID(current) != rootUnitID(next)
}

func rootUnitID(units []ProductVariantUnit) string {
	for _, item := range units {
		if strings.TrimSpace(item.ParentUnitID) == "" {
			return item.UnitID
		}
	}

	return ""
}
