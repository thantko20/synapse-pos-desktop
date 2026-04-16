package migrations

import (
	"context"
	"database/sql"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/pressly/goose/v3"
)

func init() {
	goose.AddNamedMigrationContext("005_units_and_variant_units.go", upUnitsAndVariantUnits, downUnitsAndVariantUnits)
}

type seededUnit struct {
	Name   string
	Symbol string
}

var defaultUnits = []seededUnit{
	{Name: "piece", Symbol: "pc"},
	{Name: "bottle", Symbol: "btl"},
	{Name: "pack", Symbol: "pk"},
	{Name: "case", Symbol: "cs"},
	{Name: "dozen", Symbol: "dz"},
	{Name: "kilogram", Symbol: "kg"},
	{Name: "gram", Symbol: "g"},
	{Name: "liter", Symbol: "L"},
	{Name: "milliliter", Symbol: "ml"},
	{Name: "meter", Symbol: "m"},
	{Name: "centimeter", Symbol: "cm"},
}

func upUnitsAndVariantUnits(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS unit (
			id TEXT PRIMARY KEY,
			name TEXT NOT NULL UNIQUE,
			symbol TEXT NOT NULL DEFAULT '',
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL
		)
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		ALTER TABLE product_variant RENAME TO product_variant_old
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE product_variant (
			id TEXT PRIMARY KEY,
			product_id TEXT NOT NULL,
			name TEXT NOT NULL,
			sku TEXT NOT NULL DEFAULT '',
			barcode TEXT NOT NULL DEFAULT '',
			reorder_point INTEGER NOT NULL DEFAULT 0,
			alert_threshold INTEGER NOT NULL DEFAULT 0,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
		)
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO product_variant (id, product_id, name, sku, barcode, reorder_point, alert_threshold, is_active, created_at, updated_at)
		SELECT id, product_id, name, sku, barcode, reorder_point, alert_threshold, is_active, created_at, updated_at
		FROM product_variant_old
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_sku
		ON product_variant (sku)
		WHERE sku != ''
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_barcode
		ON product_variant (barcode)
		WHERE barcode != ''
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE IF NOT EXISTS product_variant_unit (
			id TEXT PRIMARY KEY,
			product_variant_id TEXT NOT NULL,
			unit_id TEXT NOT NULL,
			parent_unit_id TEXT,
			factor_to_parent INTEGER NOT NULL,
			is_default BOOLEAN NOT NULL DEFAULT FALSE,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY (product_variant_id) REFERENCES product_variant(id) ON DELETE CASCADE,
			FOREIGN KEY (unit_id) REFERENCES unit(id),
			FOREIGN KEY (parent_unit_id) REFERENCES unit(id),
			UNIQUE(product_variant_id, unit_id)
		)
	`); err != nil {
		return err
	}

	if err := insertDefaultUnits(ctx, tx); err != nil {
		return err
	}

	if err := migrateVariantUnits(ctx, tx); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DROP TABLE product_variant_old`); err != nil {
		return err
	}

	return nil
}

func downUnitsAndVariantUnits(ctx context.Context, tx *sql.Tx) error {
	if _, err := tx.ExecContext(ctx, `ALTER TABLE product_variant RENAME TO product_variant_new`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE TABLE product_variant (
			id TEXT PRIMARY KEY,
			product_id TEXT NOT NULL,
			name TEXT NOT NULL,
			sku TEXT NOT NULL DEFAULT '',
			barcode TEXT NOT NULL DEFAULT '',
			unit_name TEXT NOT NULL DEFAULT '',
			reorder_point INTEGER NOT NULL DEFAULT 0,
			alert_threshold INTEGER NOT NULL DEFAULT 0,
			is_active BOOLEAN NOT NULL DEFAULT TRUE,
			created_at INTEGER NOT NULL,
			updated_at INTEGER NOT NULL,
			FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE
		)
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		INSERT INTO product_variant (id, product_id, name, sku, barcode, unit_name, reorder_point, alert_threshold, is_active, created_at, updated_at)
		SELECT
			pv.id,
			pv.product_id,
			pv.name,
			pv.sku,
			pv.barcode,
			COALESCE((
				SELECT u.name
				FROM product_variant_unit pvu
				JOIN unit u ON u.id = pvu.unit_id
				WHERE pvu.product_variant_id = pv.id AND pvu.is_default = TRUE AND pvu.is_active = TRUE
				LIMIT 1
			), ''),
			pv.reorder_point,
			pv.alert_threshold,
			pv.is_active,
			pv.created_at,
			pv.updated_at
		FROM product_variant_new pv
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `DROP TABLE product_variant_unit`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DROP TABLE unit`); err != nil {
		return err
	}
	if _, err := tx.ExecContext(ctx, `DROP TABLE product_variant_new`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_sku
		ON product_variant (sku)
		WHERE sku != ''
	`); err != nil {
		return err
	}

	if _, err := tx.ExecContext(ctx, `
		CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_barcode
		ON product_variant (barcode)
		WHERE barcode != ''
	`); err != nil {
		return err
	}

	return nil
}

func insertDefaultUnits(ctx context.Context, tx *sql.Tx) error {
	now := time.Now().UnixMilli()
	for _, item := range defaultUnits {
		id, err := uuid.NewV7()
		if err != nil {
			return err
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO unit (id, name, symbol, is_active, created_at, updated_at)
			VALUES (?, ?, ?, TRUE, ?, ?)
			ON CONFLICT(name) DO NOTHING
		`, id.String(), item.Name, item.Symbol, now, now); err != nil {
			return err
		}
	}

	return nil
}

func migrateVariantUnits(ctx context.Context, tx *sql.Tx) error {
	rows, err := tx.QueryContext(ctx, `
		SELECT DISTINCT unit_name
		FROM product_variant_old
		WHERE TRIM(unit_name) != ''
	`)
	if err != nil {
		return err
	}
	defer rows.Close()

	now := time.Now().UnixMilli()
	for rows.Next() {
		var name string
		if err := rows.Scan(&name); err != nil {
			return err
		}

		id, err := uuid.NewV7()
		if err != nil {
			return err
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO unit (id, name, symbol, is_active, created_at, updated_at)
			VALUES (?, ?, '', TRUE, ?, ?)
			ON CONFLICT(name) DO NOTHING
		`, id.String(), strings.TrimSpace(name), now, now); err != nil {
			return err
		}
	}
	if err := rows.Err(); err != nil {
		return err
	}

	unitIDs := map[string]string{}
	unitRows, err := tx.QueryContext(ctx, `SELECT id, name FROM unit WHERE is_active = TRUE`)
	if err != nil {
		return err
	}
	defer unitRows.Close()

	for unitRows.Next() {
		var id string
		var name string
		if err := unitRows.Scan(&id, &name); err != nil {
			return err
		}
		unitIDs[name] = id
	}
	if err := unitRows.Err(); err != nil {
		return err
	}

	variantRows, err := tx.QueryContext(ctx, `
		SELECT id, unit_name, created_at, updated_at
		FROM product_variant_old
		WHERE TRIM(unit_name) != ''
	`)
	if err != nil {
		return err
	}
	defer variantRows.Close()

	for variantRows.Next() {
		var variantID string
		var unitName string
		var createdAt int64
		var updatedAt int64
		if err := variantRows.Scan(&variantID, &unitName, &createdAt, &updatedAt); err != nil {
			return err
		}

		unitID, ok := unitIDs[strings.TrimSpace(unitName)]
		if !ok {
			return fmt.Errorf("unit %q was not created during migration", unitName)
		}

		id, err := uuid.NewV7()
		if err != nil {
			return err
		}

		if _, err = tx.ExecContext(ctx, `
			INSERT INTO product_variant_unit (id, product_variant_id, unit_id, parent_unit_id, factor_to_parent, is_default, is_active, created_at, updated_at)
			VALUES (?, ?, ?, NULL, 1, TRUE, TRUE, ?, ?)
		`, id.String(), variantID, unitID, createdAt, updatedAt); err != nil {
			return err
		}
	}

	return variantRows.Err()
}
