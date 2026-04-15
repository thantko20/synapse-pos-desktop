package core

import "context"

type AppError string

func (ae AppError) Error() string {
	return string(ae)
}

type Money int64

type Quantity float64

type UnitOfWork interface {
	WithinTx(ctx context.Context, fn func(ctx context.Context) error) error
}
