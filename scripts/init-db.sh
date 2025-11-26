#!/bin/bash

# Initialize database with schema and migrations
# Run this after starting the docker-compose services

echo "Initializing database..."

# Wait for database to be ready
echo "Waiting for database to be ready..."
until docker-compose exec -T db pg_isready -U cortexex > /dev/null 2>&1; do
    echo "Database is not ready yet. Waiting..."
    sleep 2
done

echo "Database is ready!"

# Apply schema
echo "Applying schema..."
docker-compose exec -T db psql -U cortexex -d cortexex < backend/schema.sql

# Apply migrations
echo "Applying migrations..."
for migration in backend/migrations/*.sql; do
    if [ -f "$migration" ]; then
        echo "Applying migration: $(basename $migration)"
        docker-compose exec -T db psql -U cortexex -d cortexex < "$migration"
    fi
done

echo "Database initialization complete!"

