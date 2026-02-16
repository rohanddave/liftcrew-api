# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Run Commands

This is a Maven project using the Maven Wrapper. Java 21 is required.

```bash
# Build
./mvnw clean package
./mvnw clean package -DskipTests

# Run tests
./mvnw test

# Run a single test class
./mvnw test -Dtest=ClassName

# Run a single test method
./mvnw test -Dtest=ClassName#methodName

# Start local infrastructure (Postgres, Redis, Neo4j)
docker-compose up -d

# Run the application
./mvnw spring-boot:run
```

The API is accessible at `localhost:3000/api/v1/*` when running through Nginx (docker-compose), or `localhost:8080/api/v1/*` when running directly.

## Architecture

**Spring Boot 4.0.2** REST API with a feature-module layered architecture.

### Package Layout (`com.liftcrew.api`)

- **`config/`** — Spring configuration (e.g., `WebConfig` sets the `/api/v1` prefix for all controllers)
- **`common/`** — Cross-cutting: shared DTOs (`ApiErrorResponse`), custom exceptions (`UnauthorizedException`), security annotations (`@Protected`, `@Public`), utilities (`BearerTokenExtractorUtil`)
- **`infra/`** — External service integrations: Firebase (auth token verification), Redis
- **`features/`** — Domain feature modules, each with its own `controller/`, `service/`, `dto/`, and `repository/` sub-packages

### Feature Modules

Each feature under `features/` follows the same structure: controller → service interface → service implementation → DTOs → repository. Currently implemented: **auth**. Placeholder modules: user, post, feed, social, notification, gym, workout.

### Data Stores

- **PostgreSQL** — Primary relational database (JPA/Hibernate, HikariCP pooling)
- **Neo4j** — Graph database for social relationships
- **Redis** — Caching and session storage

### Authentication Flow

Hybrid auth: Firebase Admin SDK verifies external identity tokens, then the app issues its own JWTs (via JJWT library). Custom `@Protected` and `@Public` annotations mark endpoint access requirements.

### Deployment

Multi-stage Dockerfile (Maven build → Temurin JRE 21-alpine). Docker Compose runs 3 API replicas behind an Nginx reverse proxy (least-conn) on port 3000, plus Postgres, Redis, and Neo4j.

## Environment

A `.env` file is required at the project root with database credentials, JWT secrets, and Firebase configuration. See `application.yaml` for the expected `${...}` variable references.

## Key Libraries

- **Lombok** — Used throughout for `@Getter`, `@Builder`, `@AllArgsConstructor`, `@Slf4j`, etc.
- **JJWT 0.12.6** — JWT creation and validation
- **Firebase Admin SDK 9.4.3** — Token verification