# Blog API

REST API for a blog with MongoDB sessions and Redis caching.

## Stack

- Node.js + Express
- TypeScript (strict)
- MongoDB Atlas + Mongoose
- Redis + ioredis

## Setup

1. Copy `.env.example` to `.env` and set `MONGODB_URI` and `REDIS_URL`.
   Database name: `blog_assignment_project`.
2. Start Redis locally (or use Redis Cloud).
3. Install and run:

```bash
npm install
npm run dev
```

Scripts: `dev`, `build`, `start`.

## Auth

```http
Authorization: Bearer <token>
```

## Cached GET endpoints

These set response header `X-Cache: HIT` or `X-Cache: MISS` (body unchanged):

- `GET /api/users/me`
- `GET /api/posts`
- `GET /api/posts/:id`
- `GET /api/stats`

If Redis is unavailable, the API still works using MongoDB (login rate limit may be skipped).

## Redis keys

Prefix on every key: `blog_assignment_project:`

| Key (without prefix) | Type | TTL | Set when | Deleted / invalidated when |
|----------------------|------|-----|----------|----------------------------|
| `session:<token>` | String (userId) | until session `expiresAt` | login | logout, logout-all |
| `user:<userId>:sessions` | Set of tokens | none (members removed on logout) | login | logout, logout-all |
| `user:<userId>` | JSON String (profile) | 1 hour | GET /users/me miss | PATCH /users/me |
| `post:<id>` | JSON String (published post) | 10 minutes | GET /posts/:id miss | PATCH/DELETE post, comment add/delete |
| `posts:list:version` | String (counter) | none | created on first INCR | never deleted; INCR on post/comment changes |
| `posts:list:v…` | JSON String (list response) | 60 seconds | GET /posts miss | ignored after version INCR; expires alone |
| `stats` | JSON String | 5 minutes | GET /stats miss | expires alone |
| `login:fail:<email>` | String (counter) | 15 minutes | failed login | successful login |

## Why stats can be up to 5 minutes old

Stats are heavy aggregations. A 5-minute TTL keeps responses fast under load and is acceptable for dashboard-style totals that do not need second-level freshness.

## Main endpoints

| Method | Path | Auth |
|--------|------|------|
| GET | `/api/health` | no |
| POST | `/api/auth/signup` | no |
| POST | `/api/auth/login` | no |
| POST | `/api/auth/logout` | yes |
| POST | `/api/auth/logout-all` | yes |
| GET/PATCH | `/api/users/me` | yes |
| GET | `/api/users/me/posts` | yes |
| GET/POST/PATCH/DELETE | `/api/posts` … | see assignment |
| POST/GET | `/api/posts/:id/comments` | post yes; get public |
| DELETE | `/api/comments/:id` | yes |
| GET | `/api/stats` | no |
