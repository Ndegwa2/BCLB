# Gaming Platform API Design

This document outlines the API endpoints for the gaming platform, built upon the provided database schema and user flows. The API is designed for a Flask backend with JWT authentication. All endpoints return JSON responses. Authentication is required for most endpoints via `Authorization: Bearer <token>` header, except for registration and login.

## General Notes
- **Base URL**: `/api`
- **Authentication**: JWT tokens obtained from login/register. Tokens expire after 24 hours (configurable).
- **Error Handling**: All errors return JSON `{ "error": "description" }` with appropriate HTTP status codes (400 Bad Request, 401 Unauthorized, 403 Forbidden, 404 Not Found, 409 Conflict, 500 Internal Server Error).
- **Pagination**: For list endpoints, use query params `?page=1&limit=10`.
- **Game Types Supported**: `draw_1v1`, `pool_8ball`, `card_blackjack`, `tournament_single_elimination` (tournaments extend game logic with brackets).
- **Currencies**: All amounts in KES (Kenyan Shillings), with 2 decimal places.
- **House Cut**: Default 15% on pots, configurable per game.

## 1. Authentication Endpoints

### POST /api/auth/register
Register a new user.

**Request Body**:
```json
{
  "username": "string (required, unique, 3-50 chars)",
  "email": "string (optional, unique)",
  "phone_number": "string (required for payments, e.g., +254712345678)",
  "password": "string (required, min 8 chars)"
}
```

**Response (201 Created)**:
```json
{
  "token": "jwt_token_string",
  "user": {
    "id": 1,
    "username": "string",
    "email": "string",
    "phone_number": "string",
    "is_admin": false
  }
}
```

**Errors**: 400 (invalid input), 409 (username/email taken).

### POST /api/auth/login
Authenticate user.

**Request Body**:
```json
{
  "username_or_email": "string (required)",
  "password": "string (required)"
}
```

**Response (200 OK)**:
Same as register.

**Errors**: 401 (invalid credentials).

### POST /api/auth/logout
Invalidate token (client-side; server may implement blacklist if needed).

**Auth**: Required.

**Response (200 OK)**:
```json
{ "message": "Logged out" }
```

## 2. Wallet Endpoints

### GET /api/wallet
Get user's wallet balance and recent transactions.

**Auth**: Required.

**Query Params**: `?limit=10&page=1`

**Response (200 OK)**:
```json
{
  "balance": 1000.00,
  "locked_balance": 200.00,
  "transactions": [
    {
      "id": 1,
      "amount": 100.00,
      "direction": "credit",
      "tx_type": "deposit",
      "status": "success",
      "created_at": "2023-10-01T12:00:00Z",
      "description": "M-Pesa deposit"
    }
  ]
}
```

**Errors**: 401.

## 3. Payment Endpoints

### POST /api/payments/deposit
Initiate deposit via M-Pesa.

**Auth**: Required.

**Request Body**:
```json
{
  "amount": 500.00
}
```

**Response (200 OK)**:
```json
{
  "transaction_id": 123,
  "status": "pending",
  "message": "STK push sent to phone"
}
```

**Errors**: 400 (insufficient amount), 402 (payment failed).

### POST /api/payments/withdraw
Initiate withdrawal via M-Pesa.

**Auth**: Required.

**Request Body**:
```json
{
  "amount": 300.00,
  "phone_number": "+254712345678"
}
```

**Response (200 OK)**:
Same as deposit.

**Errors**: 400 (insufficient balance).

### POST /api/payments/mpesa/callback
Callback from M-Pesa provider (internal, not for client).

**Auth**: None (provider auth via headers/secrets).

**Request Body**: Provider payload (e.g., JSON with transaction details).

**Response (200 OK)**:
```json
{ "status": "processed" }
```

Updates wallet_transactions and wallet balance on success.

## 4. Game Endpoints

### POST /api/games
Create a new game.

**Auth**: Required.

**Request Body**:
```json
{
  "game_type": "draw_1v1",
  "stake_amount": 100.00,
  "is_free": false
}
```

**Response (201 Created)**:
```json
{
  "game": {
    "id": 1,
    "game_code": "ABC123",
    "game_type": "draw_1v1",
    "stake_amount": 100.00,
    "total_pot": 100.00,
    "status": "waiting",
    "created_at": "2023-10-01T12:00:00Z"
  },
  "entry": {
    "id": 1,
    "user_id": 1,
    "stake_amount": 100.00,
    "joined_at": "2023-10-01T12:00:00Z"
  }
}
```

**Errors**: 400 (invalid type), 402 (insufficient balance).

### GET /api/games/open
List open games.

**Auth**: Required.

**Query Params**: `?game_type=draw_1v1&limit=10&page=1`

**Response (200 OK)**:
```json
{
  "games": [
    {
      "id": 1,
      "game_code": "ABC123",
      "game_type": "draw_1v1",
      "stake_amount": 100.00,
      "status": "waiting",
      "created_at": "2023-10-01T12:00:00Z"
    }
  ]
}
```

### POST /api/games/{id}/join
Join an existing game.

**Auth**: Required.

**Path Params**: `id` (game ID)

**Response (200 OK)**:
Updated game object with new entry.

**Errors**: 404 (game not found), 409 (already joined or full).

### POST /api/games/{id}/start
Start the game (for draws, server determines winner).

**Auth**: Required (must be a participant).

**Path Params**: `id`

**Response (200 OK)**:
Updated game with winner.

**Errors**: 403 (not ready), 404.

### GET /api/games/{id}
Get game details.

**Auth**: Required (participants or admin).

**Path Params**: `id`

**Response (200 OK)**:
```json
{
  "game": { ... },
  "entries": [ { "user_id": 1, "username": "player1" } ],
  "winner": { "user_id": 2, "username": "player2" }
}
```

### POST /api/games/{id}/cancel
Cancel game (refund stakes).

**Auth**: Required (creator or admin).

**Path Params**: `id`

**Response (200 OK)**:
```json
{ "status": "cancelled" }
```

**Errors**: 403 (cannot cancel).

### GET /api/games/mine
Get user's game history.

**Auth**: Required.

**Query Params**: `?status=completed&limit=10`

**Response (200 OK)**:
List of games with user entries.

## 5. Tournament Endpoints
Tournaments are multi-game events with brackets. Assume extended schema: `tournaments` table with `id, name, game_type, entry_fee, max_players, status, winner_id`.

### POST /api/tournaments
Create tournament.

**Auth**: Required (admin or premium user).

**Request Body**:
```json
{
  "name": "Weekly Draw Tournament",
  "game_type": "draw_1v1",
  "entry_fee": 50.00,
  "max_players": 16,
  "format": "single_elimination"
}
```

**Response (201 Created)**:
Tournament object.

### GET /api/tournaments/open
List open tournaments.

**Auth**: Required.

**Response (200 OK)**:
List of tournaments.

### POST /api/tournaments/{id}/join
Join tournament.

**Auth**: Required.

**Response (200 OK)**:
Entry confirmation.

### GET /api/tournaments/{id}
Get tournament details, including bracket.

**Auth**: Required.

**Response (200 OK)**:
```json
{
  "tournament": { ... },
  "bracket": [ { "round": 1, "matches": [ { "game_id": 1, "players": ["user1", "user2"] } ] } ]
}
```

### POST /api/tournaments/{id}/advance
Advance winner to next round (admin or automated).

**Auth**: Required (admin).

## 6. Admin Endpoints

### GET /api/admin/overview
Get platform overview.

**Auth**: Required (admin).

**Response (200 OK)**:
```json
{
  "total_deposits": 10000.00,
  "total_withdrawals": 8000.00,
  "house_commission": 1500.00,
  "active_games": 5
}
```

### GET /api/admin/games
List all games.

**Auth**: Required (admin).

**Query Params**: `?status=completed&limit=10`

**Response (200 OK)**:
List of games.

### GET /api/admin/users
List users.

**Auth**: Required (admin).

**Response (200 OK)**:
List of users with balances.

### POST /api/admin/users/{id}/suspend
Suspend user.

**Auth**: Required (admin).

**Response (200 OK)**:
```json
{ "message": "User suspended" }
```

## Error Handling Examples
- **401 Unauthorized**: `{ "error": "Invalid token" }`
- **403 Forbidden**: `{ "error": "Admin access required" }`
- **404 Not Found**: `{ "error": "Game not found" }`
- **409 Conflict**: `{ "error": "Game already full" }`

This design supports the specified game types by parameterizing `game_type` and extending logic for tournaments. All endpoints handle authentication, validation, and atomic transactions for payments/games.