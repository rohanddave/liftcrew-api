# LiftCrew API

NestJS backend API with Fastify, TypeORM, PostgreSQL, Redis, and Neo4j.

## Features

- NestJS with Fastify adapter
- TypeORM with PostgreSQL
- Neo4j graph database
- Redis caching
- Firebase Authentication (Phone, Google, Apple)
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
FIREBASE_SERVICE_ACCOUNT=<see serviceAccount.json - already configured>
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

## Firebase Authentication

The project is configured with Firebase Authentication for Phone, Google, and Apple sign-in.

**Project ID:** `liftcrew-df66d`
**Service Account:** Already configured in `.env`

### API Endpoints:
- `POST /firebase-auth/phone` - Phone authentication
- `POST /firebase-auth/google` - Google authentication
- `POST /firebase-auth/apple` - Apple authentication
- `POST /firebase-auth/verify-token` - Verify Firebase token
- `GET /firebase-auth/user/:uid` - Get user by UID

See `src/firebase/README.md` for detailed documentation.

## Mock Workout Seed Queries

Use these queries to seed mock workouts for the `info@oneprediction.app` user against the default gym. Covers all calendar statuses: missed, finished, in-progress, and scheduled.

```sql
-- 1. MISSED: started day before yesterday (> 4 hours ago, no finishedAt)
INSERT INTO workouts (id, name, created_by, "createdAt")
VALUES ('44444444-4444-4444-4444-444444444444', 'Missed Workout', '2c453b67-44bb-4f13-87ec-f7d767396b31', NOW() - INTERVAL '2 days');

INSERT INTO workout_participants (id, workout_id, user_id, gym_id, role, "startAt", "finishedAt", "joinedAt")
VALUES (
    'dddddddd-dddd-dddd-dddd-dddddddddddd',
    '44444444-4444-4444-4444-444444444444',
    '2c453b67-44bb-4f13-87ec-f7d767396b31',
    '46c163b6-ee46-41f4-a508-c6f5554871a6',
    'owner',
    NOW() - INTERVAL '2 days',       -- started day before yesterday
    NULL,                            -- never finished
    NOW() - INTERVAL '2 days'
);

-- 2. FINISHED: completed yesterday
INSERT INTO workouts (id, name, created_by, "createdAt")
VALUES ('33333333-3333-3333-3333-333333333333', 'Completed Workout', '2c453b67-44bb-4f13-87ec-f7d767396b31', NOW() - INTERVAL '1 day');

INSERT INTO workout_participants (id, workout_id, user_id, gym_id, role, "startAt", "finishedAt", "joinedAt")
VALUES (
    'cccccccc-cccc-cccc-cccc-cccccccccccc',
    '33333333-3333-3333-3333-333333333333',
    '2c453b67-44bb-4f13-87ec-f7d767396b31',
    '46c163b6-ee46-41f4-a508-c6f5554871a6',
    'owner',
    NOW() - INTERVAL '1 day',        -- started yesterday
    NOW() - INTERVAL '1 day' + INTERVAL '1 hour',  -- finished yesterday
    NOW() - INTERVAL '1 day'
);

-- 3. IN_PROGRESS: started today (within 4 hours), no finishedAt
INSERT INTO workouts (id, name, created_by, "createdAt")
VALUES ('11111111-1111-1111-1111-111111111111', 'In Progress Workout', '2c453b67-44bb-4f13-87ec-f7d767396b31', NOW());

INSERT INTO workout_participants (id, workout_id, user_id, gym_id, role, "startAt", "finishedAt", "joinedAt")
VALUES (
    'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
    '11111111-1111-1111-1111-111111111111',
    '2c453b67-44bb-4f13-87ec-f7d767396b31',
    '46c163b6-ee46-41f4-a508-c6f5554871a6',
    'owner',
    NOW() - INTERVAL '30 minutes',   -- started 30 min ago today
    NULL,                            -- not finished
    NOW() - INTERVAL '30 minutes'
);

-- 4. SCHEDULED: scheduled for tomorrow
INSERT INTO workouts (id, name, created_by, "createdAt")
VALUES ('22222222-2222-2222-2222-222222222222', 'Scheduled Workout', '2c453b67-44bb-4f13-87ec-f7d767396b31', NOW());

INSERT INTO workout_participants (id, workout_id, user_id, gym_id, role, "startAt", "finishedAt", "joinedAt")
VALUES (
    'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
    '22222222-2222-2222-2222-222222222222',
    '2c453b67-44bb-4f13-87ec-f7d767396b31',
    '46c163b6-ee46-41f4-a508-c6f5554871a6',
    'owner',
    NOW() + INTERVAL '1 day',        -- scheduled for tomorrow
    NULL,
    NOW()
);
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
