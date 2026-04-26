package inventory

import (
	"context"
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type InventoryRepository struct {
	db *sql.DB
}

func NewInventoryRepository(db *sql.DB) *InventoryRepository {
	return &InventoryRepository{db}
}

func (r *InventoryRepository) GetBalanceByVariantID(ctx context.Context, variantID string) (*InventoryBalance, error) {
	query := `SELECT product_id, product_variant_id, quantity, updated_at
		FROM inventory_balances WHERE product_variant_id = ?`

	var b InventoryBalance
	var updatedAtMs int64
	err := r.db.QueryRowContext(ctx, query, variantID).Scan(
		&b.ProductID, &b.ProductVariantID, &b.Quantity, &updatedAtMs,
	)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != nil {
		return nil, err
	}
	b.UpdatedAt = time.UnixMilli(updatedAtMs)
	return &b, nil
}

func (r *InventoryRepository) GetBalancesByProductID(ctx context.Context, productID string) ([]InventoryBalance, error) {
	query := `SELECT product_id, product_variant_id, quantity, updated_at
		FROM inventory_balances WHERE product_id = ? ORDER BY product_variant_id`

	rows, err := r.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	balances := make([]InventoryBalance, 0)
	for rows.Next() {
		var b InventoryBalance
		var updatedAtMs int64
		if err := rows.Scan(&b.ProductID, &b.ProductVariantID, &b.Quantity, &updatedAtMs); err != nil {
			return nil, err
		}
		b.UpdatedAt = time.UnixMilli(updatedAtMs)
		balances = append(balances, b)
	}
	return balances, nil
}

func (r *InventoryRepository) GetMovements(ctx context.Context, variantID string, limit, offset int) ([]InventoryMovement, error) {
	builder := sq.Select("id, product_id, product_variant_id, movement_type, quantity, reference_type, reference_id, notes, created_at").
		From("inventory_movements").
		Where(sq.Eq{"product_variant_id": variantID}).
		OrderBy("created_at DESC").
		Limit(uint64(limit)).
		Offset(uint64(offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	movements := make([]InventoryMovement, 0)
	for rows.Next() {
		var m InventoryMovement
		var createdAtMs int64
		if err := rows.Scan(&m.ID, &m.ProductID, &m.ProductVariantID, &m.MovementType,
			&m.Quantity, &m.ReferenceType, &m.ReferenceID, &m.Notes, &createdAtMs); err != nil {
			return nil, err
		}
		m.CreatedAt = time.UnixMilli(createdAtMs)
		movements = append(movements, m)
	}
	return movements, nil
}

func (r *InventoryRepository) GetMovementsByProductID(ctx context.Context, productID string, limit, offset int) ([]InventoryMovement, error) {
	builder := sq.Select("id, product_id, product_variant_id, movement_type, quantity, reference_type, reference_id, notes, created_at").
		From("inventory_movements").
		Where(sq.Eq{"product_id": productID}).
		OrderBy("created_at DESC").
		Limit(uint64(limit)).
		Offset(uint64(offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	movements := make([]InventoryMovement, 0)
	for rows.Next() {
		var m InventoryMovement
		var createdAtMs int64
		if err := rows.Scan(&m.ID, &m.ProductID, &m.ProductVariantID, &m.MovementType,
			&m.Quantity, &m.ReferenceType, &m.ReferenceID, &m.Notes, &createdAtMs); err != nil {
			return nil, err
		}
		m.CreatedAt = time.UnixMilli(createdAtMs)
		movements = append(movements, m)
	}
	return movements, nil
}

func (r *InventoryRepository) CountMovements(ctx context.Context, variantID string) (int, error) {
	query := `SELECT COUNT(*) FROM inventory_movements WHERE product_variant_id = ?`
	var count int
	err := r.db.QueryRowContext(ctx, query, variantID).Scan(&count)
	return count, err
}

func (r *InventoryRepository) CountMovementsByProductID(ctx context.Context, productID string) (int, error) {
	query := `SELECT COUNT(*) FROM inventory_movements WHERE product_id = ?`
	var count int
	err := r.db.QueryRowContext(ctx, query, productID).Scan(&count)
	return count, err
}

func (r *InventoryRepository) GetLowStockProducts(ctx context.Context, limit, offset int) ([]LowStockVariant, error) {
	query := `SELECT
		p.id, p.name,
		pv.id, pv.name, pv.sku, pv.reorder_point, pv.alert_threshold,
		COALESCE(ib.quantity, 0), COALESCE(ib.updated_at, 0)
	FROM product_variant pv
	JOIN product p ON p.id = pv.product_id
	LEFT JOIN inventory_balances ib ON ib.product_variant_id = pv.id
	WHERE pv.is_active = true
		AND p.is_active = true
		AND pv.reorder_point > 0
		AND COALESCE(ib.quantity, 0) <= pv.reorder_point
	ORDER BY COALESCE(ib.quantity, 0) ASC
	LIMIT ? OFFSET ?`

	rows, err := r.db.QueryContext(ctx, query, limit, offset)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	items := make([]LowStockVariant, 0)
	for rows.Next() {
		var v LowStockVariant
		var updatedAtMs int64
		if err := rows.Scan(&v.ProductID, &v.ProductName, &v.ProductVariantID, &v.VariantName,
			&v.SKU, &v.ReorderPoint, &v.AlertThreshold, &v.Quantity, &updatedAtMs); err != nil {
			return nil, err
		}
		v.UpdatedAt = time.UnixMilli(updatedAtMs)
		items = append(items, v)
	}
	return items, nil
}

func (r *InventoryRepository) CountLowStockProducts(ctx context.Context) (int, error) {
	query := `SELECT COUNT(*)
	FROM product_variant pv
	JOIN product p ON p.id = pv.product_id
	LEFT JOIN inventory_balances ib ON ib.product_variant_id = pv.id
	WHERE pv.is_active = true
		AND p.is_active = true
		AND pv.reorder_point > 0
		AND COALESCE(ib.quantity, 0) <= pv.reorder_point`

	var count int
	err := r.db.QueryRowContext(ctx, query).Scan(&count)
	return count, err
}
