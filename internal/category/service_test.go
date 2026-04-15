package category

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

func newTestService(t *testing.T) (*CategoryService, *sql.DB) {
	t.Helper()
	db := database.NewTestDB(t)
	repo := NewCategoryRepository(db)
	svc := NewCategoryService(repo)
	return svc, db
}

func seedCategories(t *testing.T, db *sql.DB, count int) []Category {
	t.Helper()
	categories := make([]Category, 0, count)
	now := time.Now()
	for i := 0; i < count; i++ {
		id := uuid.Must(uuid.NewV7()).String()
		name := fmt.Sprintf("Category %d", i+1)
		_, err := db.Exec(
			"INSERT INTO category (id, name, description, is_active, created_at, updated_at) VALUES (?, ?, '', true, ?, ?)",
			id, name, now.UnixMilli(), now.UnixMilli(),
		)
		if err != nil {
			t.Fatalf("seed category: %v", err)
		}
		categories = append(categories, Category{
			ID: id, Name: name, IsActive: true, CreatedAt: now, UpdatedAt: now,
		})
	}
	return categories
}

func TestGetAllCategories(t *testing.T) {
	ctx := context.Background()

	t.Run("empty result", func(t *testing.T) {
		svc, _ := newTestService(t)
		result, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 0 {
			t.Fatalf("expected 0 categories, got %d", len(result.Items))
		}
		if result.Total != 0 {
			t.Fatalf("expected total 0, got %d", result.Total)
		}
	})

	t.Run("pagination", func(t *testing.T) {
		svc, db := newTestService(t)
		seedCategories(t, db, 5)

		page1, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 1, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page1.Items) != 2 {
			t.Fatalf("expected 2 categories on page 1, got %d", len(page1.Items))
		}
		if page1.Total != 5 {
			t.Fatalf("expected total 5, got %d", page1.Total)
		}

		page2, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 2, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page2.Items) != 2 {
			t.Fatalf("expected 2 categories on page 2, got %d", len(page2.Items))
		}

		page3, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 3, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page3.Items) != 1 {
			t.Fatalf("expected 1 category on page 3, got %d", len(page3.Items))
		}
	})

	t.Run("excludes archived by default", func(t *testing.T) {
		svc, db := newTestService(t)
		seedCategories(t, db, 3)
		_, err := db.Exec("UPDATE category SET is_active = false WHERE id = (SELECT id FROM category LIMIT 1)")
		if err != nil {
			t.Fatalf("archive category: %v", err)
		}

		result, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 2 {
			t.Fatalf("expected 2 active categories, got %d", len(result.Items))
		}
		if result.Total != 2 {
			t.Fatalf("expected total 2, got %d", result.Total)
		}
	})

	t.Run("includes archived when flag set", func(t *testing.T) {
		svc, db := newTestService(t)
		seedCategories(t, db, 3)
		_, err := db.Exec("UPDATE category SET is_active = false WHERE id = (SELECT id FROM category LIMIT 1)")
		if err != nil {
			t.Fatalf("archive category: %v", err)
		}

		result, err := svc.GetAllCategories(ctx, GetAllCategoriesInput{Page: 1, PageSize: 10, IncludeArchived: true})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 3 {
			t.Fatalf("expected 3 categories (incl archived), got %d", len(result.Items))
		}
		if result.Total != 3 {
			t.Fatalf("expected total 3, got %d", result.Total)
		}
	})
}

func TestGetCategoryById(t *testing.T) {
	ctx := context.Background()

	t.Run("found", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")

		got, err := svc.GetCategoryById(ctx, "cat-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Fatal("expected category, got nil")
		}
		if got.ID != "cat-1" {
			t.Fatalf("expected ID cat-1, got %s", got.ID)
		}
		if got.Name != "Cat 1" {
			t.Fatalf("expected Name Cat 1, got %s", got.Name)
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)
		got, err := svc.GetCategoryById(ctx, "nonexistent-id")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})
}

func TestCreateCategory(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, _ := newTestService(t)

		created, err := svc.CreateCategory(ctx, CreateCategoryInput{
			Name:        "New Category",
			Description: "A new category",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created == nil {
			t.Fatal("expected category, got nil")
		}
		if created.Name != "New Category" {
			t.Fatalf("expected Name 'New Category', got %s", created.Name)
		}
		if created.Description != "A new category" {
			t.Fatalf("expected Description 'A new category', got %s", created.Description)
		}
		if created.ID == "" {
			t.Fatal("expected non-empty ID")
		}
		if !created.IsActive {
			t.Fatal("expected IsActive to be true")
		}

		got, err := svc.GetCategoryById(ctx, created.ID)
		if err != nil {
			t.Fatalf("unexpected error fetching created category: %v", err)
		}
		if got == nil {
			t.Fatal("created category not found in db")
		}
		if got.Name != created.Name {
			t.Fatalf("expected Name %s, got %s", created.Name, got.Name)
		}
	})

	t.Run("duplicate name", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.CreateCategory(ctx, CreateCategoryInput{Name: "Dup Category"})
		if err != nil {
			t.Fatalf("first create: %v", err)
		}

		_, err = svc.CreateCategory(ctx, CreateCategoryInput{Name: "Dup Category"})
		if err != CategoryErrNameExists {
			t.Fatalf("expected CategoryErrNameExists, got %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.CreateCategory(ctx, CreateCategoryInput{Name: ""})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}

func TestUpdateCategory(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, _ := newTestService(t)

		created, err := svc.CreateCategory(ctx, CreateCategoryInput{
			Name:        "Original",
			Description: "Original desc",
		})
		if err != nil {
			t.Fatalf("create: %v", err)
		}

		updated, err := svc.UpdateCategory(ctx, UpdateCategoryInput{
			ID:          created.ID,
			Name:        "Updated",
			Description: "Updated desc",
		})
		if err != nil {
			t.Fatalf("update: %v", err)
		}
		if updated.Name != "Updated" {
			t.Fatalf("expected Name 'Updated', got %s", updated.Name)
		}
		if updated.Description != "Updated desc" {
			t.Fatalf("expected Description 'Updated desc', got %s", updated.Description)
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.UpdateCategory(ctx, UpdateCategoryInput{
			ID:   "nonexistent",
			Name: "Test",
		})
		if err != CategoryErrNotFound {
			t.Fatalf("expected CategoryErrNotFound, got %v", err)
		}
	})

	t.Run("duplicate name on update", func(t *testing.T) {
		svc, _ := newTestService(t)

		cat1, err := svc.CreateCategory(ctx, CreateCategoryInput{Name: "Cat 1"})
		if err != nil {
			t.Fatalf("create cat1: %v", err)
		}
		_, err = svc.CreateCategory(ctx, CreateCategoryInput{Name: "Cat 2"})
		if err != nil {
			t.Fatalf("create cat2: %v", err)
		}

		_, err = svc.UpdateCategory(ctx, UpdateCategoryInput{
			ID:   cat1.ID,
			Name: "Cat 2",
		})
		if err != CategoryErrNameExists {
			t.Fatalf("expected CategoryErrNameExists, got %v", err)
		}
	})

	t.Run("same name update allowed", func(t *testing.T) {
		svc, _ := newTestService(t)

		created, err := svc.CreateCategory(ctx, CreateCategoryInput{Name: "Same Name"})
		if err != nil {
			t.Fatalf("create: %v", err)
		}

		_, err = svc.UpdateCategory(ctx, UpdateCategoryInput{
			ID:          created.ID,
			Name:        "Same Name",
			Description: "New desc",
		})
		if err != nil {
			t.Fatalf("same name update should succeed: %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.UpdateCategory(ctx, UpdateCategoryInput{
			ID:   "some-id",
			Name: "",
		})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}

func TestArchiveCategory(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, _ := newTestService(t)

		created, err := svc.CreateCategory(ctx, CreateCategoryInput{Name: "To Archive"})
		if err != nil {
			t.Fatalf("create: %v", err)
		}

		err = svc.ArchiveCategory(ctx, created.ID)
		if err != nil {
			t.Fatalf("archive: %v", err)
		}

		got, err := svc.GetCategoryById(ctx, created.ID)
		if err != nil {
			t.Fatalf("get: %v", err)
		}
		if got == nil {
			t.Fatal("expected category to still exist (soft delete)")
		}
		if got.IsActive {
			t.Fatal("expected IsActive to be false after archive")
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)

		err := svc.ArchiveCategory(ctx, "nonexistent-id")
		if err != CategoryErrNotFound {
			t.Fatalf("expected CategoryErrNotFound, got %v", err)
		}
	})
}
