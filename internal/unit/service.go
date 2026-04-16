package unit

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
)

type UnitService struct {
	repo *UnitRepository
}

func NewUnitService(repo *UnitRepository) *UnitService {
	return &UnitService{repo: repo}
}

func (s *UnitService) GetAllUnits(ctx context.Context, input GetAllUnitsInput) (*GetAllUnitsResult, error) {
	if input.PageSize == 0 {
		input.PageSize = 100
	}
	if input.Page == 0 {
		input.Page = 1
	}

	filter := UnitFilter{
		Limit:           input.PageSize,
		Offset:          (input.Page - 1) * input.PageSize,
		IncludeArchived: input.IncludeArchived,
	}

	items, err := s.repo.GetUnits(ctx, filter)
	if err != nil {
		return nil, err
	}

	total, err := s.repo.CountUnits(ctx, UnitFilter{IncludeArchived: input.IncludeArchived})
	if err != nil {
		return nil, err
	}

	return &GetAllUnitsResult{Items: items, Total: total, Page: input.Page, PageSize: input.PageSize}, nil
}

func (s *UnitService) GetUnitByID(ctx context.Context, id string) (*Unit, error) {
	return s.repo.GetUnitByID(ctx, id)
}

func (s *UnitService) CreateUnit(ctx context.Context, input CreateUnitInput) (*Unit, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}

	name := strings.TrimSpace(input.Name)
	existing, err := s.repo.GetUnitByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if existing != nil {
		return nil, UnitErrNameExists
	}

	id, err := uuid.NewV7()
	if err != nil {
		return nil, err
	}

	now := time.Now()
	item := &Unit{
		ID:        id.String(),
		Name:      name,
		Symbol:    strings.TrimSpace(input.Symbol),
		IsActive:  true,
		CreatedAt: now,
		UpdatedAt: now,
	}

	if err := s.repo.CreateUnit(ctx, item); err != nil {
		return nil, err
	}

	return item, nil
}

func (s *UnitService) UpdateUnit(ctx context.Context, input UpdateUnitInput) (*Unit, error) {
	if err := input.validate(); err != nil {
		return nil, err
	}

	existing, err := s.repo.GetUnitByID(ctx, input.ID)
	if err != nil {
		return nil, err
	}
	if existing == nil {
		return nil, UnitErrNotFound
	}

	name := strings.TrimSpace(input.Name)
	duplicate, err := s.repo.GetUnitByName(ctx, name)
	if err != nil {
		return nil, err
	}
	if duplicate != nil && duplicate.ID != input.ID {
		return nil, UnitErrNameExists
	}

	existing.Name = name
	existing.Symbol = strings.TrimSpace(input.Symbol)
	existing.UpdatedAt = time.Now()

	if err := s.repo.UpdateUnit(ctx, existing); err != nil {
		return nil, err
	}

	return existing, nil
}
