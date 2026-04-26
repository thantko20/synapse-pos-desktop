package inventory

import (
	"context"
	"database/sql"
	"testing"
	"time"

	"synapse-pos-desktop/internal/database"

	"github.com/google/uuid"
)

func newTestService(t *testing.T) (*InventoryService, *sql.DB) {
	t.Helper()
	db := database.NewTestDB(t)
	repo := NewInventoryRepository(db)
	svc := NewInventoryService(repo)
	return svc, db
}

func seedProduct(t *testing.T, db *sql.DB, id, name string) {
	t.Helper()
	now := time.Now().UnixMilli()
	_, err := db.Exec(
		"INSERT INTO product (id, name, description, category_id, brand, notes, is_active, created_at, updated_at) VALUES (?, ?, '', NULL, '', '', true, ?, ?)",
		id, name, now, now,
	)
	if err != nil {
		t.Fatalf("seed product: %v", err)
	}
}

func seedVariant(t *testing.T, db *sql.DB, id, productID, name, sku string, reorderPoint, alertThreshold int) {
	t.Helper()
	now := time.Now().UnixMilli()
	_, err := db.Exec(
		"INSERT INTO product_variant (id, product_id, name, sku, barcode, reorder_point, alert_threshold, is_active, created_at, updated_at) VALUES (?, ?, ?, ?, '', ?, ?, true, ?, ?)",
		id, productID, name, sku, reorderPoint, alertThreshold, now, now,
	)
	if err != nil {
		t.Fatalf("seed variant: %v", err)
	}
}

func seedMovement(t *testing.T, db *sql.DB, id, productID, variantID string, movementType MovementType, quantity int) {
	t.Helper()
	now := time.Now().UnixMilli()
	_, err := db.Exec(
		"INSERT INTO inventory_movements (id, product_id, product_variant_id, movement_type, quantity, reference_type, reference_id, notes, created_at) VALUES (?, ?, ?, ?, ?, '', '', '', ?)",
		id, productID, variantID, string(movementType), quantity, now,
	)
	if err != nil {
		t.Fatalf("seed movement: %v", err)
	}
}

func seedBalance(t *testing.T, db *sql.DB, productID, variantID string, quantity int) {
	t.Helper()
	now := time.Now().UnixMilli()
	_, err := db.Exec(
		"INSERT INTO inventory_balances (product_id, product_variant_id, quantity, updated_at) VALUES (?, ?, ?, ?)",
		productID, variantID, quantity, now,
	)
	if err != nil {
		t.Fatalf("seed balance: %v", err)
	}
}

func TestGetInventoryBalance(t *testing.T) {
	ctx := context.Background()

	t.Run("found", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-1", "Product 1")
		seedVariant(t, db, "var-1", "prod-1", "Variant 1", "SKU-1", 10, 5)
		seedBalance(t, db, "prod-1", "var-1", 50)

		balance, err := svc.GetInventoryBalance(ctx, "var-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if balance == nil {
			t.Fatal("expected balance, got nil")
		}
		if balance.Quantity != 50 {
			t.Fatalf("expected quantity 50, got %d", balance.Quantity)
		}
		if balance.ProductID != "prod-1" {
			t.Fatalf("expected product_id prod-1, got %s", balance.ProductID)
		}
		if balance.ProductVariantID != "var-1" {
			t.Fatalf("expected variant_id var-1, got %s", balance.ProductVariantID)
		}
	})

	t.Run("not found", func(t *testing.T) {
		svc, _ := newTestService(t)

		balance, err := svc.GetInventoryBalance(ctx, "nonexistent")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if balance != nil {
			t.Fatalf("expected nil, got %+v", balance)
		}
	})
}

func TestGetBalancesByProductID(t *testing.T) {
	ctx := context.Background()

	t.Run("multiple variants", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-1", "Product 1")
		seedVariant(t, db, "var-1", "prod-1", "Variant A", "SKU-A", 10, 5)
		seedVariant(t, db, "var-2", "prod-1", "Variant B", "SKU-B", 20, 10)
		seedBalance(t, db, "prod-1", "var-1", 30)
		seedBalance(t, db, "prod-1", "var-2", 15)

		balances, err := svc.GetBalancesByProductID(ctx, "prod-1")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(balances) != 2 {
			t.Fatalf("expected 2 balances, got %d", len(balances))
		}
	})

	t.Run("empty", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-2", "Product 2")

		balances, err := svc.GetBalancesByProductID(ctx, "prod-2")
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(balances) != 0 {
			t.Fatalf("expected 0 balances, got %d", len(balances))
		}
	})
}

func TestGetInventoryMovements(t *testing.T) {
	ctx := context.Background()

	t.Run("pagination", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-1", "Product 1")
		seedVariant(t, db, "var-1", "prod-1", "Variant 1", "SKU-1", 10, 5)

		for i := 0; i < 5; i++ {
			id := uuid.Must(uuid.NewV7()).String()
			seedMovement(t, db, id, "prod-1", "var-1", MovementTypePurchase, 10)
		}

		page1, err := svc.GetInventoryMovements(ctx, GetMovementsInput{
			ProductVariantID: "var-1",
			Page:             1,
			PageSize:         2,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page1.Items) != 2 {
			t.Fatalf("expected 2 movements on page 1, got %d", len(page1.Items))
		}
		if page1.Total != 5 {
			t.Fatalf("expected total 5, got %d", page1.Total)
		}

		page3, err := svc.GetInventoryMovements(ctx, GetMovementsInput{
			ProductVariantID: "var-1",
			Page:             3,
			PageSize:         2,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(page3.Items) != 1 {
			t.Fatalf("expected 1 movement on page 3, got %d", len(page3.Items))
		}
	})

	t.Run("empty", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-2", "Product 2")
		seedVariant(t, db, "var-2", "prod-2", "Variant 2", "SKU-2", 10, 5)

		result, err := svc.GetInventoryMovements(ctx, GetMovementsInput{
			ProductVariantID: "var-2",
			Page:             1,
			PageSize:         10,
		})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 0 {
			t.Fatalf("expected 0 movements, got %d", len(result.Items))
		}
		if result.Total != 0 {
			t.Fatalf("expected total 0, got %d", result.Total)
		}
	})
}

func TestGetLowStockProducts(t *testing.T) {
	ctx := context.Background()

	t.Run("returns low stock variants", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-1", "Product 1")
		seedVariant(t, db, "var-low", "prod-1", "Low Stock", "SKU-LOW", 10, 5)
		seedVariant(t, db, "var-ok", "prod-1", "OK Stock", "SKU-OK", 10, 5)
		seedBalance(t, db, "prod-1", "var-low", 5)
		seedBalance(t, db, "prod-1", "var-ok", 50)

		result, err := svc.GetLowStockProducts(ctx, GetLowStockInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 1 {
			t.Fatalf("expected 1 low stock variant, got %d", len(result.Items))
		}
		if result.Items[0].ProductVariantID != "var-low" {
			t.Fatalf("expected var-low, got %s", result.Items[0].ProductVariantID)
		}
		if result.Items[0].Quantity != 5 {
			t.Fatalf("expected quantity 5, got %d", result.Items[0].Quantity)
		}
		if result.Items[0].ReorderPoint != 10 {
			t.Fatalf("expected reorder point 10, got %d", result.Items[0].ReorderPoint)
		}
	})

	t.Run("includes variants with no balance", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-2", "Product 2")
		seedVariant(t, db, "var-nobal", "prod-2", "No Balance", "SKU-NB", 10, 5)

		result, err := svc.GetLowStockProducts(ctx, GetLowStockInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 1 {
			t.Fatalf("expected 1 low stock variant (no balance), got %d", len(result.Items))
		}
		if result.Items[0].Quantity != 0 {
			t.Fatalf("expected quantity 0, got %d", result.Items[0].Quantity)
		}
	})

	t.Run("excludes variants with zero reorder point", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-3", "Product 3")
		seedVariant(t, db, "var-noreorder", "prod-3", "No Reorder", "SKU-NR", 0, 0)
		seedBalance(t, db, "prod-3", "var-noreorder", 0)

		result, err := svc.GetLowStockProducts(ctx, GetLowStockInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 0 {
			t.Fatalf("expected 0 low stock variants, got %d", len(result.Items))
		}
	})

	t.Run("excludes inactive variants", func(t *testing.T) {
		svc, db := newTestService(t)
		seedProduct(t, db, "prod-4", "Product 4")
		seedVariant(t, db, "var-inactive", "prod-4", "Inactive", "SKU-IA", 10, 5)
		_, err := db.Exec("UPDATE product_variant SET is_active = false WHERE id = 'var-inactive'")
		if err != nil {
			t.Fatalf("deactivate variant: %v", err)
		}
		seedBalance(t, db, "prod-4", "var-inactive", 0)

		result, err := svc.GetLowStockProducts(ctx, GetLowStockInput{Page: 1, PageSize: 10})
		if err != nil {
			t.Fatalf("unexpected error: %v", err)
		}
		if len(result.Items) != 0 {
			t.Fatalf("expected 0 low stock variants, got %d", len(result.Items))
		}
	})
}
