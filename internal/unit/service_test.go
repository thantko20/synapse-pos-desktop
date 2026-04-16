package unit

import (
	"context"
	"database/sql"
	"fmt"
	"testing"
	"time"

	"synapse-pos-desktop/internal/database"
	"synapse-pos-desktop/internal/shared"

	"github.com/google/uuid"
)

func newTestService(t *testing.T) (*UnitService, *sql.DB) {
	t.Helper()
	db := database.NewTestDB(t)
	repo := NewUnitRepository(db)
	svc := NewUnitService(repo)
	return svc, db
}

func seedUnits(t *testing.T, db *sql.DB, count int) []Unit {
	t.Helper()
	items := make([]Unit, 0, count)
	now := time.Now()
	for i := 0; i < count; i++ {
		id := uuid.Must(uuid.NewV7()).String()
		name := fmt.Sprintf("custom-unit-%d", i+1)
		symbol := fmt.Sprintf("u%d", i+1)
		_, err := db.Exec(
			"INSERT INTO unit (id, name, symbol, is_active, created_at, updated_at) VALUES (?, ?, ?, true, ?, ?)",
			id, name, symbol, now.UnixMilli(), now.UnixMilli(),
		)
		if err != nil {
			t.Fatalf("seed unit: %v", err)
		}

		items = append(items, Unit{
			ID:        id,
			Name:      name,
			Symbol:    symbol,
			IsActive:  true,
			CreatedAt: now,
			UpdatedAt: now,
		})
	}

	return items
}

func TestGetAllUnits(t *testing.T) {
	ctx := context.Background()

	t.Run("returns seeded units", func(t *testing.T) {
		svc, db := newTestService(t)
		seedUnits(t, db, 3)

		result, err := svc.GetAllUnits(ctx, GetAllUnitsInput{Page: 1, PageSize: 100})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if result.Total < 3 {
			t.Fatalf("expected at least 3 units, got %d", result.Total)
		}
		if len(result.Items) < 3 {
			t.Fatalf("expected at least 3 units in page, got %d", len(result.Items))
		}
	})

	t.Run("excludes archived by default", func(t *testing.T) {
		svc, db := newTestService(t)
		items := seedUnits(t, db, 2)
		_, err := db.Exec("UPDATE unit SET is_active = false WHERE id = ?", items[0].ID)
		if err != nil {
			t.Fatalf("archive unit: %v", err)
		}

		result, err := svc.GetAllUnits(ctx, GetAllUnitsInput{Page: 1, PageSize: 100})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		for _, item := range result.Items {
			if item.ID == items[0].ID {
				t.Fatal("expected archived unit to be excluded")
			}
		}
	})

	t.Run("includes archived when requested", func(t *testing.T) {
		svc, db := newTestService(t)
		items := seedUnits(t, db, 2)
		_, err := db.Exec("UPDATE unit SET is_active = false WHERE id = ?", items[0].ID)
		if err != nil {
			t.Fatalf("archive unit: %v", err)
		}

		result, err := svc.GetAllUnits(ctx, GetAllUnitsInput{Page: 1, PageSize: 100, IncludeArchived: true})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}

		found := false
		for _, item := range result.Items {
			if item.ID == items[0].ID {
				found = true
				break
			}
		}
		if !found {
			t.Fatal("expected archived unit to be included")
		}
	})
}

func TestGetUnitByID(t *testing.T) {
	ctx := context.Background()

	t.Run("found", func(t *testing.T) {
		svc, db := newTestService(t)
		items := seedUnits(t, db, 1)

		got, err := svc.GetUnitByID(ctx, items[0].ID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil || got.ID != items[0].ID {
			t.Fatal("expected seeded unit")
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)

		got, err := svc.GetUnitByID(ctx, "missing")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})
}

func TestCreateUnit(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, _ := newTestService(t)

		created, err := svc.CreateUnit(ctx, CreateUnitInput{Name: "tray", Symbol: "tr"})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created == nil || created.ID == "" {
			t.Fatal("expected created unit")
		}
		if created.Name != "tray" {
			t.Fatalf("expected unit name tray, got %s", created.Name)
		}
	})

	t.Run("duplicate name", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.CreateUnit(ctx, CreateUnitInput{Name: "tray"})
		if err != nil {
			t.Fatalf("first create: %v", err)
		}

		_, err = svc.CreateUnit(ctx, CreateUnitInput{Name: "tray"})
		if err != UnitErrNameExists {
			t.Fatalf("expected UnitErrNameExists, got %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.CreateUnit(ctx, CreateUnitInput{Name: ""})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}

func TestUpdateUnit(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, _ := newTestService(t)
		created, err := svc.CreateUnit(ctx, CreateUnitInput{Name: "tray", Symbol: "tr"})
		if err != nil {
			t.Fatalf("create: %v", err)
		}

		updated, err := svc.UpdateUnit(ctx, UpdateUnitInput{ID: created.ID, Name: "bundle", Symbol: "bdl"})
		if err != nil {
			t.Fatalf("update: %v", err)
		}
		if updated.Name != "bundle" || updated.Symbol != "bdl" {
			t.Fatalf("unexpected updated values: %+v", updated)
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.UpdateUnit(ctx, UpdateUnitInput{ID: "missing", Name: "bundle"})
		if err != UnitErrNotFound {
			t.Fatalf("expected UnitErrNotFound, got %v", err)
		}
	})

	t.Run("duplicate name", func(t *testing.T) {
		svc, _ := newTestService(t)
		first, err := svc.CreateUnit(ctx, CreateUnitInput{Name: "tray"})
		if err != nil {
			t.Fatalf("create first: %v", err)
		}
		_, err = svc.CreateUnit(ctx, CreateUnitInput{Name: "bundle"})
		if err != nil {
			t.Fatalf("create second: %v", err)
		}

		_, err = svc.UpdateUnit(ctx, UpdateUnitInput{ID: first.ID, Name: "bundle"})
		if err != UnitErrNameExists {
			t.Fatalf("expected UnitErrNameExists, got %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.UpdateUnit(ctx, UpdateUnitInput{ID: "some-id", Name: ""})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}
