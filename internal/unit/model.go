package unit

import (
	"strings"
	"synapse-pos-desktop/internal/shared"
	"time"
)

type Unit struct {
	ID        string    `json:"id"`
	Name      string    `json:"name"`
	Symbol    string    `json:"symbol"`
	IsActive  bool      `json:"isActive"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type UnitFilter struct {
	ID              string
	Name            string
	Limit           int
	Offset          int
	IncludeArchived bool
}

type GetAllUnitsInput struct {
	Page            int  `json:"page"`
	PageSize        int  `json:"pageSize"`
	IncludeArchived bool `json:"includeArchived"`
}

type GetUnitByIdInput struct {
	ID string `json:"id"`
}

type CreateUnitInput struct {
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

func (i *CreateUnitInput) validate() error {
	if strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	return nil
}

type UpdateUnitInput struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Symbol string `json:"symbol"`
}

func (i *UpdateUnitInput) validate() error {
	if strings.TrimSpace(i.ID) == "" || strings.TrimSpace(i.Name) == "" {
		return shared.ValidationErr
	}

	return nil
}

type GetAllUnitsResult struct {
	Items    []Unit `json:"items"`
	Total    int    `json:"total"`
	Page     int    `json:"page"`
	PageSize int    `json:"pageSize"`
}
