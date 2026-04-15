package database

import (
	"context"
	"database/sql"
	"embed"
	"io/fs"

	_ "github.com/mattn/go-sqlite3"
	"github.com/pressly/goose/v3"
)

//go:embed migrations
var migrationsFS embed.FS

func Connect(dsn string) (*sql.DB, error) {
	db, err := sql.Open("sqlite3", dsn)
	if err != nil {
		return nil, err
	}

	db.Exec("PRAGMA foreign_keys = ON")

	fsys, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		return nil, err
	}

	provider, err := goose.NewProvider(goose.DialectSQLite3, db, fsys)
	if err != nil {
		return nil, err
	}

	_, err = provider.Up(context.Background())
	if err != nil {
		return nil, err
	}

	return db, nil
}
