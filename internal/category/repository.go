package category

import (
	"context"
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type CategoryRepository struct {
	db *sql.DB
}

func NewCategoryRepository(db *sql.DB) *CategoryRepository {
	return &CategoryRepository{db}
}

func (r *CategoryRepository) GetAllCategories(ctx context.Context, filter CategoryFilter) ([]Category, error) {
	builder := sq.Select("id, name, description, is_active, created_at, updated_at").
		From("category")

	if !filter.IncludeArchived {
		builder = builder.Where(sq.Eq{"is_active": true})
	}

	if filter.ID != "" {
		builder = builder.Where(sq.Eq{"id": filter.ID})
	}

	if filter.Name != "" {
		builder = builder.Where(sq.Eq{"name": filter.Name})
	}

	if filter.Limit == 0 {
		filter.Limit = 20
	}

	builder = builder.OrderBy("created_at DESC").Limit(uint64(filter.Limit)).Offset(uint64(filter.Offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	categories := make([]Category, 0)
	for rows.Next() {
		var c Category
		var createdAtMs, updatedAtMs int64
		if err = rows.Scan(&c.ID, &c.Name, &c.Description, &c.IsActive, &createdAtMs, &updatedAtMs); err != nil {
			return nil, err
		}
		c.CreatedAt = time.UnixMilli(createdAtMs)
		c.UpdatedAt = time.UnixMilli(updatedAtMs)
		categories = append(categories, c)
	}

	return categories, nil
}

func (r *CategoryRepository) GetCategoryById(ctx context.Context, id string) (*Category, error) {
	categories, err := r.GetAllCategories(ctx, CategoryFilter{
		ID:              id,
		Limit:           1,
		IncludeArchived: true,
	})
	if err != nil {
		return nil, err
	}

	if len(categories) == 0 {
		return nil, nil
	}

	return &categories[0], nil
}

func (r *CategoryRepository) GetOneCategory(ctx context.Context, filter CategoryFilter) (*Category, error) {
	filter.Limit = 1
	filter.Offset = 0
	filter.IncludeArchived = true
	categories, err := r.GetAllCategories(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(categories) == 0 {
		return nil, nil
	}
	return &categories[0], nil
}

func (r *CategoryRepository) CountCategories(ctx context.Context, includeArchived bool) (int, error) {
	builder := sq.Select("COUNT(*)").From("category")
	if !includeArchived {
		builder = builder.Where(sq.Eq{"is_active": true})
	}

	var count int
	err := builder.RunWith(r.db).QueryRowContext(ctx).Scan(&count)
	return count, err
}

func (r *CategoryRepository) CreateCategory(ctx context.Context, c *Category) error {
	query := `INSERT INTO category (id, name, description, is_active, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?)`
	_, err := r.db.ExecContext(ctx, query, c.ID, c.Name, c.Description, c.IsActive, c.CreatedAt.UnixMilli(), c.UpdatedAt.UnixMilli())
	return err
}

func (r *CategoryRepository) UpdateCategory(ctx context.Context, c *Category) error {
	query := `UPDATE category SET name = ?, description = ?, updated_at = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, c.Name, c.Description, c.UpdatedAt.UnixMilli(), c.ID)
	return err
}

func (r *CategoryRepository) ArchiveCategory(ctx context.Context, id string) error {
	query := `UPDATE category SET is_active = false, updated_at = ? WHERE id = ?`
	_, err := r.db.ExecContext(ctx, query, time.Now().UnixMilli(), id)
	return err
}
