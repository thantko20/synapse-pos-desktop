package database

import (
	"context"
	"database/sql"
	"io/fs"
	"testing"
	"time"

	"github.com/pressly/goose/v3"
	_ "modernc.org/sqlite"
)

func NewTestDB(t *testing.T) *sql.DB {
	t.Helper()
	db, err := sql.Open("sqlite", ":memory:")
	if err != nil {
		t.Fatalf("open test db: %v", err)
	}
	db.Exec("PRAGMA foreign_keys = ON")

	fsys, err := fs.Sub(migrationsFS, "migrations")
	if err != nil {
		db.Close()
		t.Fatalf("sub fs: %v", err)
	}

	provider, err := goose.NewProvider(goose.DialectSQLite3, db, fsys, goose.WithDisableVersioning(true))
	if err != nil {
		db.Close()
		t.Fatalf("create goose provider: %v", err)
	}

	if _, err = provider.Up(context.Background()); err != nil {
		db.Close()
		t.Fatalf("run migrations: %v", err)
	}

	t.Cleanup(func() { db.Close() })
	return db
}

func SeedCategory(t *testing.T, db *sql.DB, id, name string) {
	t.Helper()
	now := time.Now().UnixMilli()
	_, err := db.Exec("INSERT INTO category (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, '', true, ?, ?)", id, name, now, now)
	if err != nil {
		t.Fatalf("seed category: %v", err)
	}
}
