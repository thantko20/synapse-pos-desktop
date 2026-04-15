package core

import (
	"context"
	"time"
)

type OutboxEventStatus string

const (
	OutboxEventStatusPending   OutboxEventStatus = "pending"
	OutboxEventStatusPublished OutboxEventStatus = "published"
	OutboxEventStatusFailed    OutboxEventStatus = "failed"
)

type OutboxEvent struct {
	ID            string
	AggregateType string
	AggregateID   string
	EventType     string
	EventVersion  int
	Payload       []byte
	OccurredAt    time.Time
	PublishedAt   *time.Time
	Status        OutboxEventStatus
}

type SyncCheckpoint struct {
	Name          string
	LastEventID   string
	LastSyncedAt  *time.Time
	LastError     string
	LastAttemptAt *time.Time
}

type OutboxRepository interface {
	Append(ctx context.Context, events []OutboxEvent) error
	ListPending(ctx context.Context, limit int) ([]OutboxEvent, error)
	MarkPublished(ctx context.Context, eventIDs []string, publishedAt time.Time) error
	MarkFailed(ctx context.Context, eventID string, failure string) error
	LoadCheckpoint(ctx context.Context, name string) (*SyncCheckpoint, error)
	SaveCheckpoint(ctx context.Context, checkpoint *SyncCheckpoint) error
}
