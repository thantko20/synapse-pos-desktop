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
			Brand:       fmt.Sprintf("Brand %d", i+1),
			Notes:       fmt.Sprintf("Note %d", i+1),
			IsActive:    true,
			CreatedAt:   now,
			UpdatedAt:   now,
		}
		_, err := db.Exec(
			"INSERT INTO product (id, name, description, category_id, brand, notes, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
			p.ID, p.Name, p.Description, p.CategoryID, p.Brand, p.Notes, p.IsActive, p.CreatedAt.UnixMilli(), p.UpdatedAt.UnixMilli(),
		)
		if err != nil {
			t.Fatalf("seed product: %v", err)
		}

		for variantIndex := 0; variantIndex < 2; variantIndex++ {
			seedVariant(t, db, ProductVariant{
				ID:             uuid.Must(uuid.NewV7()).String(),
				ProductID:      p.ID,
				Name:           fmt.Sprintf("Variant %d-%d", i+1, variantIndex+1),
				SKU:            fmt.Sprintf("SKU-%s-%d", p.ID, variantIndex+1),
				Barcode:        fmt.Sprintf("BAR-%s-%d", p.ID, variantIndex+1),
				UnitName:       "piece",
				ReorderPoint:   variantIndex + 1,
				AlertThreshold: variantIndex + 2,
				IsActive:       true,
				CreatedAt:      now,
				UpdatedAt:      now,
			})
		}

		products = append(products, p)
	}
	return products
}

func seedVariant(t *testing.T, db *sql.DB, variant ProductVariant) {
	t.Helper()
	_, err := db.Exec(
		"INSERT INTO product_variant (id, product_id, name, sku, barcode, unit_name, reorder_point, alert_threshold, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
		variant.ID,
		variant.ProductID,
		variant.Name,
		variant.SKU,
		variant.Barcode,
		variant.UnitName,
		variant.ReorderPoint,
		variant.AlertThreshold,
		variant.IsActive,
		variant.CreatedAt.UnixMilli(),
		variant.UpdatedAt.UnixMilli(),
	)
	if err != nil {
		t.Fatalf("seed variant: %v", err)
	}
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
		result, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 0 {
			t.Fatalf("expected 0 products, got %d", len(result.Items))
		}
	})

	t.Run("pagination and count", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")
		seedProducts(t, db, 5, "cat-1")

		page1, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 2})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page1.Items) != 2 {
			t.Fatalf("expected 2 products on page 1, got %d", len(page1.Items))
		}
		if page1.Total != 5 {
			t.Fatalf("expected total 5, got %d", page1.Total)
		}
		if page1.Items[0].VariantCount != 2 {
			t.Fatalf("expected variant count 2, got %d", page1.Items[0].VariantCount)
		}
	})

	t.Run("category filter", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-a", "Cat A")
		database.SeedCategory(t, db, "cat-b", "Cat B")
		seedProducts(t, db, 3, "cat-a")
		seedProducts(t, db, 2, "cat-b")

		result, err := svc.GetAllProducts(ctx, GetProductsInput{
			Page:       1,
			PageSize:   10,
			CategoryID: "cat-a",
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 3 {
			t.Fatalf("expected 3 products in cat-a, got %d", len(result.Items))
		}
	})

	t.Run("query filter", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")
		products := seedProducts(t, db, 2, "cat-1")

		result, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 10, Query: products[0].Name})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 1 {
			t.Fatalf("expected 1 product, got %d", len(result.Items))
		}
	})
}

func TestGetProductById(t *testing.T) {
	ctx := context.Background()

	t.Run("found with variants", func(t *testing.T) {
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
		if len(got.Variants) != 2 {
			t.Fatalf("expected 2 variants, got %d", len(got.Variants))
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
			Brand:       "Acme",
			Notes:       "Internal note",
			Variants: []CreateProductVariantInput{{
				Name:           "Default",
				SKU:            "SKU-NEW-1",
				Barcode:        "BAR-NEW-1",
				UnitName:       "piece",
				ReorderPoint:   2,
				AlertThreshold: 1,
			}},
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if created == nil || len(created.Variants) != 1 {
			t.Fatal("expected product with one variant")
		}

		got, err := svc.GetProductById(ctx, created.ID)
		if err != nil {
			t.Fatalf("unexpected error fetching created product: %v", err)
		}
		if got == nil || len(got.Variants) != 1 {
			t.Fatal("created product not found with variants")
		}
	})

	t.Run("requires variant", func(t *testing.T) {
		svc, _ := newTestService(t)
		_, err := svc.CreateProduct(ctx, CreateProductInput{Name: "No Variant"})
		if err != ProductErrVariantMin {
			t.Fatalf("expected ProductErrVariantMin, got %v", err)
		}
	})

	t.Run("duplicate variant sku", func(t *testing.T) {
		svc, db := newTestService(t)
		database.SeedCategory(t, db, "cat-1", "Cat 1")
		_, err := svc.CreateProduct(ctx, CreateProductInput{
			Name: "Product 1",
			Variants: []CreateProductVariantInput{{
				Name: "V1", SKU: "DUP-SKU",
			}},
		})
		if err != nil {
			t.Fatalf("first create: %v", err)
		}

		_, err = svc.CreateProduct(ctx, CreateProductInput{
			Name: "Product 2",
			Variants: []CreateProductVariantInput{{
				Name: "V2", SKU: "DUP-SKU",
			}},
		})
		if err != VariantErrSKUExists {
			t.Fatalf("expected VariantErrSKUExists, got %v", err)
		}
	})

	t.Run("empty name validation", func(t *testing.T) {
		svc, _ := newTestService(t)
		_, err := svc.CreateProduct(ctx, CreateProductInput{
			Name:     "",
			Variants: []CreateProductVariantInput{{Name: "Variant"}},
		})
		if err != shared.ValidationErr {
			t.Fatalf("expected ValidationErr, got %v", err)
		}
	})
}

func TestUpdateProduct(t *testing.T) {
	ctx := context.Background()
	svc, db := newTestService(t)
	database.SeedCategory(t, db, "cat-1", "Cat 1")
	products := seedProducts(t, db, 1, "cat-1")
	existing, err := svc.GetProductById(ctx, products[0].ID)
	if err != nil {
		t.Fatalf("get product: %v", err)
	}

	updated, err := svc.UpdateProduct(ctx, UpdateProductInput{
		ID:          existing.ID,
		Name:        "Updated Product",
		Description: "Updated description",
		CategoryID:  existing.CategoryID,
		Brand:       "Updated Brand",
		Notes:       "Updated Notes",
		Variants: []UpdateProductVariantInput{
			{
				ID:             existing.Variants[0].ID,
				Name:           "Renamed Variant",
				SKU:            existing.Variants[0].SKU,
				Barcode:        existing.Variants[0].Barcode,
				UnitName:       "box",
				ReorderPoint:   10,
				AlertThreshold: 5,
			},
			{
				Name:           "New Variant",
				SKU:            "SKU-NEW",
				Barcode:        "BAR-NEW",
				UnitName:       "piece",
				ReorderPoint:   3,
				AlertThreshold: 2,
			},
		},
	})
	if err != nil {
		t.Fatalf("update product: %v", err)
	}
	if updated.Name != "Updated Product" {
		t.Fatalf("expected updated name, got %s", updated.Name)
	}
	if len(updated.Variants) != 2 {
		t.Fatalf("expected 2 variants after sync, got %d", len(updated.Variants))
	}

	reloaded, err := svc.GetProductById(ctx, existing.ID)
	if err != nil {
		t.Fatalf("reload product: %v", err)
	}
	if len(reloaded.Variants) != 2 {
		t.Fatalf("expected 2 variants after reload, got %d", len(reloaded.Variants))
	}
	for _, variant := range reloaded.Variants {
		if variant.ID == existing.Variants[1].ID {
			t.Fatal("expected removed variant to be deleted")
		}
	}
}

func TestArchiveProduct(t *testing.T) {
	ctx := context.Background()
	svc, db := newTestService(t)
	database.SeedCategory(t, db, "cat-1", "Cat 1")
	products := seedProducts(t, db, 1, "cat-1")

	if err := svc.ArchiveProduct(ctx, products[0].ID); err != nil {
		t.Fatalf("archive product: %v", err)
	}

	result, err := svc.GetAllProducts(ctx, GetProductsInput{Page: 1, PageSize: 10})
	if err != nil {
		t.Fatalf("list products: %v", err)
	}
	if len(result.Items) != 0 {
		t.Fatalf("expected archived product to be hidden, got %d items", len(result.Items))
	}

	archived, err := svc.GetProductById(ctx, products[0].ID)
	if err != nil {
		t.Fatalf("get archived product: %v", err)
	}
	if archived == nil || archived.IsActive {
		t.Fatal("expected archived product to remain accessible by id")
	}
}
