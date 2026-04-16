package unit

import (
	"context"
	"database/sql"
)

type UnitApi struct {
	ctx context.Context
	svc *UnitService
}

func NewUnitApi(db *sql.DB) *UnitApi {
	repo := NewUnitRepository(db)
	svc := NewUnitService(repo)
	return &UnitApi{svc: svc}
}

func (a *UnitApi) SetContext(ctx context.Context) {
	a.ctx = ctx
}

func (a *UnitApi) GetAllUnits(input GetAllUnitsInput) (*GetAllUnitsResult, error) {
	return a.svc.GetAllUnits(a.ctx, input)
}

func (a *UnitApi) GetUnitById(input GetUnitByIdInput) (*Unit, error) {
	return a.svc.GetUnitByID(a.ctx, input.ID)
}

func (a *UnitApi) CreateUnit(input CreateUnitInput) (*Unit, error) {
	return a.svc.CreateUnit(a.ctx, input)
}

func (a *UnitApi) UpdateUnit(input UpdateUnitInput) (*Unit, error) {
	return a.svc.UpdateUnit(a.ctx, input)
}
