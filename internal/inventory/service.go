package inventory

import (
	"context"
)

type InventoryService struct {
	repo *InventoryRepository
}

func NewInventoryService(repo *InventoryRepository) *InventoryService {
	return &InventoryService{repo}
}

func (s *InventoryService) GetInventoryBalance(ctx context.Context, variantID string) (*InventoryBalance, error) {
	return s.repo.GetBalanceByVariantID(ctx, variantID)
}

func (s *InventoryService) GetBalancesByProductID(ctx context.Context, productID string) ([]InventoryBalance, error) {
	return s.repo.GetBalancesByProductID(ctx, productID)
}

func (s *InventoryService) GetInventoryMovements(ctx context.Context, input GetMovementsInput) (*GetMovementsResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.Page == 0 {
		input.Page = 1
	}

	offset := (input.Page - 1) * input.PageSize

	movements, err := s.repo.GetMovements(ctx, input.ProductVariantID, input.PageSize, offset)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountMovements(ctx, input.ProductVariantID)
	if err != nil {
		return nil, err
	}

	return &GetMovementsResult{
		Items:    movements,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
	}, nil
}

func (s *InventoryService) GetMovementsByProductID(ctx context.Context, input GetMovementsInput) (*GetMovementsResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.Page == 0 {
		input.Page = 1
	}

	offset := (input.Page - 1) * input.PageSize

	movements, err := s.repo.GetMovementsByProductID(ctx, input.ProductID, input.PageSize, offset)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountMovementsByProductID(ctx, input.ProductID)
	if err != nil {
		return nil, err
	}

	return &GetMovementsResult{
		Items:    movements,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
	}, nil
}

func (s *InventoryService) GetLowStockProducts(ctx context.Context, input GetLowStockInput) (*GetLowStockResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 20
	}
	if input.Page == 0 {
		input.Page = 1
	}

	offset := (input.Page - 1) * input.PageSize

	items, err := s.repo.GetLowStockProducts(ctx, input.PageSize, offset)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountLowStockProducts(ctx)
	if err != nil {
		return nil, err
	}

	return &GetLowStockResult{
		Items:    items,
		Total:    total,
		Page:     input.Page,
		PageSize: input.PageSize,
	}, nil
}
