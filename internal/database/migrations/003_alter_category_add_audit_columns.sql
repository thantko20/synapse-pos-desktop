-- +goose Up
ALTER TABLE category ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE category ADD COLUMN created_at INTEGER NOT NULL DEFAULT 0;
ALTER TABLE category ADD COLUMN updated_at INTEGER NOT NULL DEFAULT 0;

-- +goose Down
ALTER TABLE category DROP COLUMN updated_at;
ALTER TABLE category DROP COLUMN created_at;
ALTER TABLE category DROP COLUMN is_active;