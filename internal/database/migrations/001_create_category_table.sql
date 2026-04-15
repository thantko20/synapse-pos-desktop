-- +goose Up
CREATE TABLE IF NOT EXISTS category (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT ''
);

-- +goose Down
DROP TABLE IF EXISTS category;
