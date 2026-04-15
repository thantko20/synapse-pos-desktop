package product

import (
	"context"
	"database/sql"
	"time"

	sq "github.com/Masterminds/squirrel"
)

type ProductRepository struct {
	db *sql.DB
}

func NewProductRepository(db *sql.DB) *ProductRepository {
	return &ProductRepository{
		db,
	}
}

func (r *ProductRepository) GetProducts(ctx context.Context, filter ProductFilter) ([]Product, error) {
	builder := sq.Select(`p.id as pid, p.name as pname, p.description as pdes, p.is_active as pactive,
	p.category_id as category_id, p.created_at as pcreated, p.updated_at as pupdated,
	c.id as cid, c.name as category_name`).
		From("product p").LeftJoin("category c on p.category_id = c.id")

	if filter.Limit == 0 {
		filter.Limit = 20
	}

	if filter.ID != "" {
		builder = builder.Where(sq.Eq{"p.id": filter.ID})
	}

	if filter.CategoryID != "" {
		builder = builder.Where(sq.Eq{"p.category_id": filter.CategoryID})
	}

	if filter.Name != "" {
		builder = builder.Where(sq.Eq{"p.name": filter.Name})
	}

	builder = builder.Limit(uint64(filter.Limit)).Offset(uint64(filter.Offset))

	rows, err := builder.RunWith(r.db).QueryContext(ctx)
	if err != nil {
		return nil, err
	}
	defer rows.Close()

	products := make([]Product, 0)

	for rows.Next() {
		var product Product
		product.Category = &ProductCategory{}
		var createdAtMs, updatedAtMs int64
		if err = rows.Scan(
			&product.ID, &product.Name, &product.Description, &product.IsActive,
			&product.CategoryID, &createdAtMs, &updatedAtMs,
			&product.Category.ID, &product.Category.Name,
		); err != nil {
			return nil, err
		}

		product.CreatedAt = time.UnixMilli(createdAtMs)
		product.UpdatedAt = time.UnixMilli(updatedAtMs)

		products = append(products, product)
	}

	return products, nil

}

func (r *ProductRepository) GetProductById(ctx context.Context, id string) (*Product, error) {
	products, err := r.GetProducts(ctx, ProductFilter{
		ID:    id,
		Limit: 1,
	})

	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		// lack of product with certain ID is not an indication of error in repository layer
		return nil, nil
	}

	return &products[0], nil
}

func (r *ProductRepository) GetOneProduct(ctx context.Context, filter ProductFilter) (*Product, error) {
	filter.Limit = 1
	filter.Offset = 0
	products, err := r.GetProducts(ctx, filter)
	if err != nil {
		return nil, err
	}

	if len(products) == 0 {
		return nil, nil
	}
	return &products[0], nil
}

func (r *ProductRepository) CreateProduct(ctx context.Context, product *Product) error {
	query := ` INSERT INTO product
	(id, name, description, category_id, is_active, created_at, updated_at)
	VALUES (?, ?, ?, ?, ?, ?, ?)
	`
	_, err := r.db.ExecContext(ctx, query, product.ID, product.Name,
		product.Description, product.CategoryID, product.IsActive,
		product.CreatedAt.UnixMilli(), product.UpdatedAt.UnixMilli())

	return err
}
