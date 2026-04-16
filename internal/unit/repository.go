package unit

import (
	"context"
	"database/sql"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type UnitRepository struct {
	db *sql.DB
}

func NewUnitRepository(db *sql.DB) *UnitRepository {
	return &UnitRepository{db: db}
}

func (r *UnitRepository) GetUnits(ctx context.Context, filter UnitFilter) ([]Unit, error) {
	builder := sq.Select("id", "name", "symbol", "is_active", "created_at", "updated_at").From("unit")
	builder = applyUnitFilter(builder, filter)

	if filter.Limit == 0 {
		filter.Limit = 100
	}

	builder = builder.OrderBy("name ASC").Limit(uint64(filter.Limit)).Offset(uint64(filter.Offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	units := make([]Unit, 0)
	for rows.Next() {
		var item Unit
		var createdAt int64
		var updatedAt int64
		if err := rows.Scan(&item.ID, &item.Name, &item.Symbol, &item.IsActive, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		item.CreatedAt = time.UnixMilli(createdAt)
		item.UpdatedAt = time.UnixMilli(updatedAt)
		units = append(units, item)
	}

	return units, rows.Err()
}

func (r *UnitRepository) CountUnits(ctx context.Context, filter UnitFilter) (int, error) {
	builder := sq.Select("COUNT(*)").From("unit")
	builder = applyUnitFilter(builder, filter)

	var count int
	err := builder.RunWith(r.db).QueryRowContext(ctx).Scan(&count)
	return count, err
}

func (r *UnitRepository) GetUnitByID(ctx context.Context, id string) (*Unit, error) {
	units, err := r.GetUnits(ctx, UnitFilter{ID: id, Limit: 1, IncludeArchived: true})
	if err != nil {
		return nil, err
	}
	if len(units) == 0 {
		return nil, nil
	}

	return &units[0], nil
}

func (r *UnitRepository) GetUnitByName(ctx context.Context, name string) (*Unit, error) {
	units, err := r.GetUnits(ctx, UnitFilter{Name: name, Limit: 1, IncludeArchived: true})
	if err != nil {
		return nil, err
	}
	if len(units) == 0 {
		return nil, nil
	}

	return &units[0], nil
}

func (r *UnitRepository) CreateUnit(ctx context.Context, item *Unit) error {
	_, err := r.db.ExecContext(ctx, `
		INSERT INTO unit (id, name, symbol, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?)
	`, item.ID, item.Name, item.Symbol, item.IsActive, item.CreatedAt.UnixMilli(), item.UpdatedAt.UnixMilli())
	return err
}

func (r *UnitRepository) UpdateUnit(ctx context.Context, item *Unit) error {
	_, err := r.db.ExecContext(ctx, `
		UPDATE unit
		SET name = ?, symbol = ?, updated_at = ?
		WHERE id = ?
	`, item.Name, item.Symbol, item.UpdatedAt.UnixMilli(), item.ID)
	return err
}

func (r *UnitRepository) GetActiveUnitsByIDs(ctx context.Context, ids []string) (map[string]Unit, error) {
	result := make(map[string]Unit, len(ids))
	if len(ids) == 0 {
		return result, nil
	}

	builder := sq.Select("id", "name", "symbol", "is_active", "created_at", "updated_at").
		From("unit").
		Where(sq.Eq{"id": ids, "is_active": true})

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	for rows.Next() {
		var item Unit
		var createdAt int64
		var updatedAt int64
		if err := rows.Scan(&item.ID, &item.Name, &item.Symbol, &item.IsActive, &createdAt, &updatedAt); err != nil {
			return nil, err
		}

		item.CreatedAt = time.UnixMilli(createdAt)
		item.UpdatedAt = time.UnixMilli(updatedAt)
		result[item.ID] = item
	}

	return result, rows.Err()
}

func applyUnitFilter(builder sq.SelectBuilder, filter UnitFilter) sq.SelectBuilder {
	if !filter.IncludeArchived {
		builder = builder.Where(sq.Eq{"is_active": true})
	}

	if strings.TrimSpace(filter.ID) != "" {
		builder = builder.Where(sq.Eq{"id": strings.TrimSpace(filter.ID)})
	}

	if strings.TrimSpace(filter.Name) != "" {
		builder = builder.Where(sq.Eq{"name": strings.TrimSpace(filter.Name)})
	}

	return builder
}
