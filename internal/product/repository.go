package product

import (
	"context"
	"database/sql"
	"strings"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{db: db}
}

func (r *ProductRepository) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	builder := sq.Select(
		"p.id",
		"p.name",
		"p.description",
		"p.category_id",
		"p.brand",
		"p.notes",
		"p.is_active",
		"p.created_at",
		"p.updated_at",
		"c.id",
		"c.name",
		"c.description",
		"COUNT(v.id) AS variant_count",
	).
		From("product p").
		LeftJoin("category c ON p.category_id = c.id").
		LeftJoin("product_variant v ON v.product_id = p.id AND v.is_active = true").
		GroupBy("p.id, c.id")

	builder = applyProductFilter(builder, filter)

	if filter.Limit == 0 {
		filter.Limit = 20
	}

	builder = builder.OrderBy("p.created_at DESC").Limit(uint64(filter.Limit)).Offset(uint64(filter.Offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]Product, 0)
	for rows.Next() {
		var product Product
		var productCategoryID sql.NullString
		var categoryID sql.NullString
		var categoryName sql.NullString
		var categoryDescription sql.NullString
		var createdAtMs int64
		var updatedAtMs int64

		if err = rows.Scan(
			&product.ID,
			&product.Name,
			&product.Description,
			&productCategoryID,
			&product.Brand,
			&product.Notes,
			&product.IsActive,
			&createdAtMs,
			&updatedAtMs,
			&categoryID,
			&categoryName,
			&categoryDescription,
			&product.VariantCount,
		); err != nil {
			return nil, err
		}

		product.CreatedAt = time.UnixMilli(createdAtMs)
		product.UpdatedAt = time.UnixMilli(updatedAtMs)
		product.CategoryID = productCategoryID.String

		if categoryID.Valid {
			product.Category = &ProductCategory{
				ID:          categoryID.String,
				Name:        categoryName.String,
				Description: categoryDescription.String,
			}
		}

		products = append(products, product)
	}

	return products, rows.Err()
}

func (r *ProductRepository) CountProducts(ctx context.Context, filter ProductFilter) (int, error) {
	builder := sq.Select("COUNT(DISTINCT p.id)").From("product p")
	builder = applyProductFilter(builder, filter)

	var count int
	err := builder.RunWith(r.db).QueryRowContext(ctx).Scan(&count)
	return count, err
}

func (r *ProductRepository) GetProductById(ctx context.Context, id string) (*Product, error) {
	products, err := r.GetProducts(ctx, ProductFilter{
		ID:              id,
		Limit:           1,
		IncludeArchived: true,
	})
	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, nil
	}

	variants, err := r.GetVariantsByProductID(ctx, id)
	if err != nil {
		return nil, err
	}

	products[0].Variants = variants
	products[0].VariantCount = len(variants)
	return &products[0], nil
}

func (r *ProductRepository) GetOneProduct(ctx context.Context, filter ProductFilter) (*Product, error) {
	filter.Limit = 1
	filter.Offset = 0
	filter.IncludeArchived = true
	products, err := r.GetProducts(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, nil
	}

	return &products[0], nil
}

func (r *ProductRepository) GetVariantsByProductID(ctx context.Context, productID string) ([]ProductVariant, error) {
	query := `
		SELECT id, product_id, name, sku, barcode, unit_name, reorder_point, alert_threshold, is_active, created_at, updated_at
		FROM product_variant
		WHERE product_id = ? AND is_active = true
		ORDER BY created_at ASC
	`

	rows, err := r.db.QueryContext(ctx, query, productID)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	variants := make([]ProductVariant, 0)
	for rows.Next() {
		var variant ProductVariant
		var createdAtMs int64
		var updatedAtMs int64
		if err = rows.Scan(
			&variant.ID,
			&variant.ProductID,
			&variant.Name,
			&variant.SKU,
			&variant.Barcode,
			&variant.UnitName,
			&variant.ReorderPoint,
			&variant.AlertThreshold,
			&variant.IsActive,
			&createdAtMs,
			&updatedAtMs,
		); err != nil {
			return nil, err
		}

		variant.CreatedAt = time.UnixMilli(createdAtMs)
		variant.UpdatedAt = time.UnixMilli(updatedAtMs)
		variants = append(variants, variant)
	}

	return variants, rows.Err()
}

func (r *ProductRepository) CreateProductWithVariants(ctx context.Context, product *Product, variants []ProductVariant) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	_, err = tx.ExecContext(ctx, `
		INSERT INTO product (id, name, description, category_id, brand, notes, is_active, created_at, updated_at)
		VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
	`, product.ID, product.Name, product.Description, nullableString(product.CategoryID), product.Brand, product.Notes, product.IsActive, product.CreatedAt.UnixMilli(), product.UpdatedAt.UnixMilli())
	if err != nil {
		return err
	}

	for idx := range variants {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO product_variant (id, product_id, name, sku, barcode, unit_name, reorder_point, alert_threshold, is_active, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, variants[idx].ID, variants[idx].ProductID, variants[idx].Name, variants[idx].SKU, variants[idx].Barcode, variants[idx].UnitName, variants[idx].ReorderPoint, variants[idx].AlertThreshold, variants[idx].IsActive, variants[idx].CreatedAt.UnixMilli(), variants[idx].UpdatedAt.UnixMilli())
		if err != nil {
			return err
		}
	}

	err = tx.Commit()
	return err
}

func (r *ProductRepository) UpdateProductWithVariants(ctx context.Context, product *Product, createVariants []ProductVariant, updateVariants []ProductVariant, deleteVariantIDs []string) error {
	tx, err := r.db.BeginTx(ctx, nil)
	if err != nil {
		return err
	}

	defer func() {
		if err != nil {
			_ = tx.Rollback()
		}
	}()

	_, err = tx.ExecContext(ctx, `
		UPDATE product
		SET name = ?, description = ?, category_id = ?, brand = ?, notes = ?, updated_at = ?
		WHERE id = ?
	`, product.Name, product.Description, nullableString(product.CategoryID), product.Brand, product.Notes, product.UpdatedAt.UnixMilli(), product.ID)
	if err != nil {
		return err
	}

	for idx := range createVariants {
		_, err = tx.ExecContext(ctx, `
			INSERT INTO product_variant (id, product_id, name, sku, barcode, unit_name, reorder_point, alert_threshold, is_active, created_at, updated_at)
			VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
		`, createVariants[idx].ID, createVariants[idx].ProductID, createVariants[idx].Name, createVariants[idx].SKU, createVariants[idx].Barcode, createVariants[idx].UnitName, createVariants[idx].ReorderPoint, createVariants[idx].AlertThreshold, createVariants[idx].IsActive, createVariants[idx].CreatedAt.UnixMilli(), createVariants[idx].UpdatedAt.UnixMilli())
		if err != nil {
			return err
		}
	}

	for idx := range updateVariants {
		_, err = tx.ExecContext(ctx, `
			UPDATE product_variant
			SET name = ?, sku = ?, barcode = ?, unit_name = ?, reorder_point = ?, alert_threshold = ?, updated_at = ?
			WHERE id = ?
		`, updateVariants[idx].Name, updateVariants[idx].SKU, updateVariants[idx].Barcode, updateVariants[idx].UnitName, updateVariants[idx].ReorderPoint, updateVariants[idx].AlertThreshold, updateVariants[idx].UpdatedAt.UnixMilli(), updateVariants[idx].ID)
		if err != nil {
			return err
		}
	}

	for _, variantID := range deleteVariantIDs {
		_, err = tx.ExecContext(ctx, `DELETE FROM product_variant WHERE id = ?`, variantID)
		if err != nil {
			return err
		}
	}

	err = tx.Commit()
	return err
}

func (r *ProductRepository) ArchiveProduct(ctx context.Context, id string) error {
	_, err := r.db.ExecContext(ctx, `UPDATE product SET is_active = false, updated_at = ? WHERE id = ?`, time.Now().UnixMilli(), id)
	return err
}

func (r *ProductRepository) VariantSKUExists(ctx context.Context, sku string, excludeID string) (bool, error) {
	return r.variantIdentifierExists(ctx, "sku", sku, excludeID)
}

func (r *ProductRepository) VariantBarcodeExists(ctx context.Context, barcode string, excludeID string) (bool, error) {
	return r.variantIdentifierExists(ctx, "barcode", barcode, excludeID)
}

func (r *ProductRepository) variantIdentifierExists(ctx context.Context, column string, value string, excludeID string) (bool, error) {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return false, nil
	}

	builder := sq.Select("COUNT(*)").From("product_variant").Where(sq.Eq{column: trimmed, "is_active": true})
	if excludeID != "" {
		builder = builder.Where(sq.NotEq{"id": excludeID})
	}

	var count int
	err := builder.RunWith(r.db).QueryRowContext(ctx).Scan(&count)
	return count > 0, err
}

func applyProductFilter(builder sq.SelectBuilder, filter ProductFilter) sq.SelectBuilder {
	if !filter.IncludeArchived {
		builder = builder.Where(sq.Eq{"p.is_active": true})
	}

	if filter.ID != "" {
		builder = builder.Where(sq.Eq{"p.id": filter.ID})
	}

	if filter.CategoryID != "" {
		builder = builder.Where(sq.Eq{"p.category_id": filter.CategoryID})
	}

	if filter.Name != "" {
		builder = builder.Where(sq.Eq{"p.name": filter.Name})
	}

	query := strings.TrimSpace(filter.Query)
	if query != "" {
		like := "%" + query + "%"
		builder = builder.Where(sq.Or{
			sq.Like{"p.name": like},
			sq.Like{"p.brand": like},
			sq.Expr("EXISTS (SELECT 1 FROM product_variant pv WHERE pv.product_id = p.id AND pv.is_active = true AND (pv.name LIKE ? OR pv.sku LIKE ? OR pv.barcode LIKE ?))", like, like, like),
		})
	}

	return builder
}

func nullableString(value string) any {
	trimmed := strings.TrimSpace(value)
	if trimmed == "" {
		return nil
	}

	return trimmed
}
