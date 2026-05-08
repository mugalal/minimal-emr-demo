# Minimal EMR — developer convenience commands
# Run `make help` to see all targets.

.PHONY: help dev start test audit docker-build docker-run docker-stop clean

## help: Show this help message
help:
	@grep -E '^## ' $(MAKEFILE_LIST) | sed 's/## //' | column -t -s ':'

## dev: Start the server in development mode with auto-reload (requires nodemon)
dev:
	npm run dev

## start: Start the server in production mode
start:
	npm run start:prod

## test: Run the integration test suite
test:
	npm test

## audit: Run npm security audit
audit:
	npm audit --audit-level=high

## install: Install all dependencies
install:
	npm ci

## docker-build: Build the production Docker image
docker-build:
	docker build --target release -t minimal-emr:latest .

## docker-run: Run the Docker image locally (reads from .env)
docker-run:
	docker run --rm -p 3000:3000 --env-file .env minimal-emr:latest

## docker-compose-up: Start via docker compose
docker-compose-up:
	docker compose up --build

## docker-stop: Stop and remove docker compose containers
docker-stop:
	docker compose down

## clean: Remove node_modules and build artifacts
clean:
	rm -rf node_modules
