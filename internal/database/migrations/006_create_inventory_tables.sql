-- +goose Up
CREATE TABLE IF NOT EXISTS inventory_movements (
    id TEXT PRIMARY KEY,
    product_id TEXT NOT NULL,
    product_variant_id TEXT NOT NULL,
    movement_type TEXT NOT NULL CHECK (movement_type IN ('purchase', 'sale', 'adjustment', 'return', 'transfer')),
    quantity INTEGER NOT NULL,
    reference_type TEXT NOT NULL DEFAULT '',
    reference_id TEXT NOT NULL DEFAULT '',
    notes TEXT NOT NULL DEFAULT '',
    created_at INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variant(id) ON DELETE CASCADE
);

CREATE INDEX idx_inventory_movements_variant ON inventory_movements (product_variant_id);
CREATE INDEX idx_inventory_movements_product ON inventory_movements (product_id);

CREATE TABLE IF NOT EXISTS inventory_balances (
    product_id TEXT NOT NULL,
    product_variant_id TEXT PRIMARY KEY,
    quantity INTEGER NOT NULL DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (product_id) REFERENCES product(id) ON DELETE CASCADE,
    FOREIGN KEY (product_variant_id) REFERENCES product_variant(id) ON DELETE CASCADE
);

-- +goose Down
DROP TABLE IF EXISTS inventory_balances;
DROP TABLE IF EXISTS inventory_movements;
