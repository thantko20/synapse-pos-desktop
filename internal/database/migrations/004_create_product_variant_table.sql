-- +goose Up
CREATE TABLE IF NOT EXISTS product_variant (
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
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_sku
ON product_variant (sku)
WHERE sku != '';

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_variant_barcode
ON product_variant (barcode)
WHERE barcode != '';

-- +goose Down
DROP INDEX IF EXISTS idx_product_variant_barcode;
DROP INDEX IF EXISTS idx_product_variant_sku;
DROP TABLE IF EXISTS product_variant;
