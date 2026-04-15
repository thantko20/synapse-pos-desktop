package category

import (
	"synapse-pos-desktop/internal/shared"
	"time"
)

type Category struct {
	ID          string    `json:"id"`
	Name        string    `json:"name"`
	Description string    `json:"description"`
	IsActive    bool      `json:"isActive"`
	CreatedAt   time.Time `json:"createdAt"`
	UpdatedAt   time.Time `json:"updatedAt"`
}

type CategoryFilter struct {
	ID              string
	Name            string
	Limit           int
	Offset          int
	IncludeArchived bool
}

type GetAllCategoriesInput struct {
	Page            int  `json:"page"`
	PageSize        int  `json:"pageSize"`
	IncludeArchived bool `json:"includeArchived"`
}

type GetCategoryByIdInput struct {
	ID string `json:"id"`
}

type CreateCategoryInput struct {
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (i *CreateCategoryInput) validate() error {
	if len(i.Name) == 0 {
		return shared.ValidationErr
	}
	return nil
}

type UpdateCategoryInput struct {
	ID          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
}

func (i *UpdateCategoryInput) validate() error {
	if len(i.Name) == 0 {
		return shared.ValidationErr
	}
	return nil
}

type GetAllCategoriesResult struct {
	Items    []Category `json:"items"`
	Total    int        `json:"total"`
	Page     int        `json:"page"`
	PageSize int        `json:"pageSize"`
}
