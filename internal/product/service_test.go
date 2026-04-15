package product

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

func seedProducts(t *testing.T, db *sql.DB, count int, categoryID string) []Product {
	t.Helper()
	products := make([]Product, 0, count)
	now := time.Now()
	for i := 0; i < count; i++ {
		p := Product{
			ID:          uuid.Must(uuid.NewV7()).String(),
			Name:        fmt.Sprintf("Product %d", i+1),
			Description: fmt.Sprintf("Description %d", i+1),
			CategoryID:  categoryID,
			IsActive:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		_, err := db.Exec(
			"INSERT INTO product (id, name, description, category_id, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?)",
			p.ID, p.Name, p.Description, p.CategoryID, p.IsActive, p.CreatedAt.UnixMilli(), p.UpdatedAt.UnixMilli(),
		)
		if err != nil {
			t.Fatalf("seed product: %v", err)
		}
		products = append(products, p)
	}
	return products
}

func newTestService(t *testing.T) (*ProductService, *sql.DB) {
	t.Helper()
	db := database.NewTestDB(t)
	repo := NewProductRepository(db)
	svc := NewProductService(repo)
	return svc, db
}

func TestGetAllProducts(t *testing.T) {
	ctx := context.Background()

	t.Run("empty result", func(t *testing.T) {
		svc, _ := newTestService(t)
		products, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(products) != 0 {
			t.Fatalf("expected 0 products, got %d", len(products))
		}
	})

	t.Run("pagination", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")
		seedProducts(t, db, 5, "cat-1")

		page1, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page1) != 2 {
			t.Fatalf("expected 2 products on page 1, got %d", len(page1))
		}

		page2, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 2, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page2) != 2 {
			t.Fatalf("expected 2 products on page 2, got %d", len(page2))
		}

		page3, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 3, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page3) != 1 {
			t.Fatalf("expected 1 product on page 3, got %d", len(page3))
		}
	})

	t.Run("category filter", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-a", "Cat A")
		database.SeedCategory(t, db, "cat-b", "Cat B")
		seedProducts(t, db, 3, "cat-a")
		seedProducts(t, db, 2, "cat-b")

		products, err := svc.GetAllProducts(ctx, GetProductsInput{
			Page:       1,
			PageSize:   10,
			CategoryID: "cat-a",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(products) != 3 {
			t.Fatalf("expected 3 products in cat-a, got %d", len(products))
		}
	})
}

func TestGetProductById(t *testing.T) {
	ctx := context.Background()

	t.Run("found", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")
		products := seedProducts(t, db, 1, "cat-1")

		got, err := svc.GetProductById(ctx, products[0].ID)
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got == nil {
			t.Fatal("expected product, got nil")
		}
		if got.ID != products[0].ID {
			t.Fatalf("expected ID %s, got %s", products[0].ID, got.ID)
		}
		if got.Name != products[0].Name {
			t.Fatalf("expected Name %s, got %s", products[0].Name, got.Name)
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)
		got, err := svc.GetProductById(ctx, "nonexistent-id")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if got != nil {
			t.Fatalf("expected nil, got %+v", got)
		}
	})
}

func TestCreateProduct(t *testing.T) {
	ctx := context.Background()

	t.Run("happy path", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")

		created, err := svc.CreateProduct(ctx, CreateProductInput{
			Name:        "New Product",
			Description: "A new product",
			CategoryID:  "cat-1",
			IsActive:    true,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created == nil {
			t.Fatal("expected product, got nil")
		}
		if created.Name != "New Product" {
			t.Fatalf("expected Name 'New Product', got %s", created.Name)
		}
		if created.ID == "" {
			t.Fatal("expected non-empty ID")
		}

		got, err := svc.GetProductById(ctx, created.ID)
		if err != nil {
			t.Fatalf("unexpected error fetching created product: %v", err)
		}
		if got == nil {
			t.Fatal("created product not found in db")
		}
		if got.Name != created.Name {
			t.Fatalf("expected Name %s, got %s", created.Name, got.Name)
		}
	})

	t.Run("duplicate name", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")

		_, err := svc.CreateProduct(ctx, CreateProductInput{
			Name:       "Dup Product",
			CategoryID: "cat-1",
			IsActive:   true,
		})
		if err != nil {
			t.Fatalf("first create: %v", err)
		}

		_, err = svc.CreateProduct(ctx, CreateProductInput{
			Name:       "Dup Product",
			CategoryID: "cat-1",
			IsActive:   true,
		})
		if err != ProductErrNameExists {
			t.Fatalf("expected ProductErrNameExists, got %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)

		_, err := svc.CreateProduct(ctx, CreateProductInput{
			Name:     "",
			IsActive: true,
		})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}
