# LiftCrew API

NestJS backend API with Fastify, TypeORM, PostgreSQL, and Redis.

## Features

- NestJS with Fastify adapter
- TypeORM with PostgreSQL
- Redis caching
- Docker support (dev & production)
- Swagger API documentation

## Environment Variables

Create a `.env` file with the following variables:

```
DATABASE_HOST=
DATABASE_PORT=
DATABASE_USER=
DATABASE_PASSWORD=
DATABASE_NAME=
MODE=
RUN_MIGRATIONS=
REDIS_HOST=
REDIS_PORT=
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
# Build development image
docker build --target development -t liftcrew-api:dev .

# Run development container
docker run -p 3000:3000 -v $(pwd):/usr/src/app liftcrew-api:dev

# Or use docker-compose
docker-compose up
```

### Production Mode
```bash
# Build production image
docker build --target production -t liftcrew-api:prod .

# Run production container
docker run -p 3000:3000 liftcrew-api:prod
```

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
