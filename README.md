# LiftCrew API

NestJS backend API with Fastify, TypeORM, PostgreSQL, Redis, and Neo4j.

## Features

- NestJS with Fastify adapter
- TypeORM with PostgreSQL
- Neo4j graph database
- Redis caching
- Docker support (dev & production)
- Swagger API documentation

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_HOST=127.0.0.1
DATABASE_PORT=5432
DATABASE_USER=postgres
DATABASE_PASSWORD=liftcrew
DATABASE_NAME=liftcrew
MODE=DEV
RUN_MIGRATIONS=true
REDIS_HOST=localhost
REDIS_PORT=6379
NEO4J_URI=bolt://localhost:7687
NEO4J_USERNAME=neo4j
NEO4J_PASSWORD=liftcrew123
```

## Local Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run start:dev

# Run in watch mode
npm run start:dev

# Build the application
npm run build

# Run in production mode
npm run start:prod
```

## Docker Commands

### Development Mode
```bash
# Start all services (API, PostgreSQL, Redis, Neo4j)
docker-compose up

# Start in detached mode
docker-compose up -d

# View logs
docker-compose logs -f

# Stop all services
docker-compose down
```

### Production Mode
```bash
# Build production image
docker build --target production -t liftcrew-api:prod .

# Run production container
docker run -p 3000:3000 liftcrew-api:prod
```

## Accessing Services

- **API**: http://localhost:3000
- **Swagger Docs**: http://localhost:3000/api
- **PostgreSQL**: localhost:5432
- **Redis**: localhost:6379
- **Neo4j Browser**: http://localhost:7474 (username: neo4j, password: liftcrew123)
- **Neo4j Bolt**: bolt://localhost:7687

## Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Test coverage
npm run test:cov
```

## Author

- [@rohanddave](https://github.com/rohanddave)
