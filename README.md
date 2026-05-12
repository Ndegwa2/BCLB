# 🎮 Gaming Platform

A comprehensive multiplayer gaming platform featuring 1v1 draw games, pool (8-ball), blackjack, poker, and tournament systems with AI opponents, wallet management, and M-Pesa payment integration.

## 📋 Table of Contents

- [Features](#-features)
- [Technology Stack](#-technology-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Database Schema](#-database-schema)
- [Deployment](#-deployment)
- [Development](#-development)
- [Testing](#-testing)
- [Contributing](#-contributing)
- [License](#-license)

## 🚀 Features

### 🎯 Game Types
- **1v1 Draw Games**: Strategic number drawing with betting
- **Pool (8-Ball)**: Physics-based pool game with AI assistance
- **Blackjack**: Classic card game with betting
- **Poker**: Texas Hold'em with tournament support
- **Tournaments**: Single and double elimination brackets

### 🤖 AI Integration
- Multiple difficulty levels (Easy, Medium, Hard, Expert)
- Adaptive AI opponents that learn from player patterns
- AI move suggestions for pool games
- Configurable AI personalities (Aggressive, Defensive, Balanced)

### 💰 Wallet & Payments
- Secure wallet system with transaction history
- M-Pesa integration for deposits and withdrawals
- Demo mode with fake currency
- Real-time balance updates

### 🏆 Tournament System
- Single and double elimination tournaments
- Entry fees and prize pools
- Bracket visualization
- Automated match progression

### 🔐 Security & Performance
- JWT-based authentication
- Rate limiting and request queuing
- Database caching and query optimization
- Connection pooling
- CORS support

### 📊 Admin Panel
- User management
- Game monitoring
- Tournament administration
- System statistics

## 🛠 Technology Stack

### Backend
- **Framework**: Flask (Python)
- **Database**: PostgreSQL with SQLAlchemy
- **Authentication**: JWT tokens
- **Caching**: Redis (planned)
- **Payments**: M-Pesa API
- **Deployment**: Docker + Kubernetes

### Frontend
- **Framework**: React 18 with TypeScript
- **Routing**: React Router v6
- **Styling**: Tailwind CSS
- **State Management**: React Context
- **Physics Engine**: Matter.js (for pool game)
- **Game Engine**: Phaser.js (planned)

### DevOps
- **Containerization**: Docker
- **Orchestration**: Kubernetes (EKS)
- **CI/CD**: GitHub Actions
- **Monitoring**: Prometheus + Grafana
- **Logging**: ELK Stack

## 🏗 Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   React SPA     │    │   Flask API     │    │   PostgreSQL    │
│                 │    │                 │    │                 │
│ • Game Lobby    │◄──►│ • Game Logic    │◄──►│ • Users         │
│ • Wallet UI     │    │ • AI Opponents  │    │ • Games         │
│ • Tournaments   │    │ • Payments      │    │ • Transactions  │
│ • Admin Panel   │    │ • Tournaments   │    │ • Tournaments   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 ▼
                    ┌─────────────────┐
                    │   Redis Cache   │
                    │                 │
                    │ • Session Data  │
                    │ • Game States   │
                    │ • Query Cache   │
                    └─────────────────┘
```

### Key Components

#### Backend Structure
```
backend/
├── app/
│   ├── __init__.py          # Flask app initialization
│   ├── auth.py             # JWT authentication
│   ├── models/             # SQLAlchemy models
│   │   ├── user.py         # User model
│   │   ├── game.py         # Game & GameEntry models
│   │   ├── tournament.py   # Tournament models
│   │   └── wallet.py       # Transaction models
│   ├── routes/             # API endpoints
│   │   ├── auth.py         # Authentication routes
│   │   ├── games.py        # Game management
│   │   ├── tournaments.py  # Tournament routes
│   │   ├── wallet.py       # Payment routes
│   │   └── admin.py        # Admin routes
│   ├── services/           # Business logic
│   │   ├── ai_opponent.py  # AI game logic
│   │   └── balance_service.py # Wallet operations
│   └── middleware/         # Flask middleware
│       ├── rate_limiter.py # Rate limiting
│       ├── cache.py        # Caching layer
│       └── request_queue.py # Request queuing
├── migrations/             # Database migrations
├── run.py                  # Application entry point
└── requirements.txt        # Python dependencies
```

#### Frontend Structure
```
frontend/
├── src/
│   ├── app/                # Main app components
│   ├── components/         # Reusable UI components
│   │   ├── auth/           # Authentication components
│   │   ├── games/          # Game-specific components
│   │   ├── wallet/         # Wallet components
│   │   ├── tournaments/    # Tournament components
│   │   └── ui/             # Base UI components
│   ├── contexts/           # React contexts
│   │   ├── AuthContext.tsx # Authentication state
│   │   ├── WalletContext.tsx # Wallet state
│   │   └── GameContext.tsx # Game state
│   ├── pages/              # Page components
│   ├── services/           # API services
│   ├── types/              # TypeScript definitions
│   └── utils/              # Utility functions
├── public/                 # Static assets
└── package.json            # Node dependencies
```

## 🚀 Getting Started

### Prerequisites
- Python 3.8+
- Node.js 18+
- PostgreSQL 13+
- Docker (optional)

### Quick Start with Docker
```bash
# Clone the repository
git clone <repository-url>
cd gaming-platform

# Start all services
docker-compose up -d

# The application will be available at:
# Frontend: http://localhost:3000
# Backend API: http://localhost:5000
# Database: localhost:5432
```

### Manual Installation

#### Backend Setup
```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set environment variables
export DATABASE_URL="postgresql://user:password@localhost:5432/game_logic"
export SECRET_KEY="your-secret-key"
export M_PESA_CONSUMER_KEY="your-mpesa-key"
export M_PESA_CONSUMER_SECRET="your-mpesa-secret"

# Run database migrations
flask db upgrade

# Seed initial data
python seed_users.py
python seed_ai_bots.py

# Start the server
python run.py
```

#### Frontend Setup
```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## ⚙️ Configuration

### Environment Variables

#### Backend (.env)
```env
# Flask Configuration
SECRET_KEY=your-secret-key-here
FLASK_ENV=development
DEBUG=True

# Database
DATABASE_URL=postgresql://user:password@localhost:5432/game_logic
SQLALCHEMY_TRACK_MODIFICATIONS=False

# M-Pesa Integration
M_PESA_CONSUMER_KEY=your-consumer-key
M_PESA_CONSUMER_SECRET=your-consumer-secret
M_PESA_SHORTCODE=your-shortcode
M_PESA_PASSKEY=your-passkey
M_PESA_ENVIRONMENT=sandbox  # or production

# Redis (Optional)
REDIS_URL=redis://localhost:6379

# Email (Optional)
SMTP_SERVER=smtp.gmail.com
SMTP_PORT=587
SMTP_USERNAME=your-email@gmail.com
SMTP_PASSWORD=your-app-password

# CORS
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

#### Frontend (.env)
```env
VITE_API_BASE_URL=http://localhost:5000/api
VITE_APP_ENV=development
```

## 📚 API Documentation

### Authentication Endpoints

#### POST /api/auth/register
Register a new user account.
```json
{
  "username": "player123",
  "email": "player@example.com",
  "phone_number": "+254712345678",
  "password": "securepassword"
}
```

#### POST /api/auth/login
Authenticate user and return JWT token.
```json
{
  "phone_number": "+254712345678",
  "password": "securepassword"
}
```

### Game Endpoints

#### POST /api/games
Create a new game.
```json
{
  "game_type": "draw_1v1",
  "stake_amount": 50.00,
  "is_free": false,
  "allow_ai": false,
  "ai_difficulty": "medium"
}
```

#### GET /api/games/open
Get list of open games.
- Query parameters: `page`, `limit`, `game_type`

#### POST /api/games/{game_id}/join
Join an existing game.

#### POST /api/games/{game_id}/start
Start a game (automatically determines winner).

### Tournament Endpoints

#### POST /api/tournaments
Create a new tournament (admin only).
```json
{
  "name": "Weekly Championship",
  "game_type": "pool_8ball",
  "entry_fee": 100.00,
  "max_players": 16,
  "format": "single_elimination"
}
```

#### POST /api/tournaments/{tournament_id}/join
Join a tournament.

### Wallet Endpoints

#### GET /api/wallet/balance
Get user's current balance.

#### POST /api/wallet/deposit
Initiate M-Pesa deposit.
```json
{
  "amount": 500.00,
  "phone_number": "+254712345678"
}
```

#### POST /api/wallet/withdraw
Request withdrawal.
```json
{
  "amount": 200.00,
  "phone_number": "+254712345678"
}
```

### Admin Endpoints (Require Admin Access)

#### GET /api/admin/users
List all users with pagination.

#### GET /api/admin/games
List all games with filtering.

#### GET /api/admin/tournaments
List all tournaments.

#### GET /api/system/stats
Get system performance statistics.

## 🗄️ Database Schema

### Core Tables

#### users
- `id`: Primary key
- `username`: Unique username
- `email`: Optional email
- `phone_number`: Required for M-Pesa
- `password`: Bcrypt hashed
- `is_admin`: Admin flag
- `is_ai`: AI bot flag
- `ai_difficulty`: AI difficulty level

#### games
- `id`: Primary key
- `game_code`: 6-character unique code
- `game_type`: Game type enum
- `stake_amount`: Bet amount
- `total_pot`: Total prize pool
- `status`: waiting/in_progress/completed/cancelled
- `allow_ai`: AI opponent flag
- `ai_opponent_id`: Reference to AI user

#### game_entries
- `id`: Primary key
- `user_id`: Foreign key to users
- `game_id`: Foreign key to games
- `stake_amount`: Individual stake
- `result`: win/loss/draw
- `payout_amount`: Winnings

#### tournaments
- `id`: Primary key
- `name`: Tournament name
- `game_type`: Game type
- `entry_fee`: Entry cost
- `max_players`: Maximum participants
- `status`: open/in_progress/completed
- `format`: single_elimination/double_elimination

#### wallet_transactions
- `id`: Primary key
- `user_id`: Foreign key to users
- `amount`: Transaction amount
- `direction`: credit/debit
- `tx_type`: game_stake/game_win/tournament_entry/etc.
- `status`: success/pending/failed

## 🚀 Deployment

### Production Deployment

#### Docker Compose (Recommended)
```yaml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "80:80"
    environment:
      - VITE_API_BASE_URL=https://api.yourdomain.com

  backend:
    build: ./backend
    ports:
      - "5000:5000"
    environment:
      - DATABASE_URL=${DATABASE_URL}
      - SECRET_KEY=${SECRET_KEY}
    depends_on:
      - postgres

  postgres:
    image: postgres:13
    environment:
      - POSTGRES_DB=game_logic
      - POSTGRES_USER=${DB_USER}
      - POSTGRES_PASSWORD=${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

#### AWS Deployment
See [deployment_scaling_strategy.md](deployment_scaling_strategy.md) for detailed AWS deployment guide.

### Environment Setup
1. Set up PostgreSQL database
2. Configure environment variables
3. Run database migrations
4. Seed AI bot accounts
5. Build and deploy containers
6. Configure load balancer and CDN

## 🧪 Testing

### Backend Testing
```bash
cd backend

# Run unit tests
python -m pytest tests/ -v

# Run with coverage
python -m pytest tests/ --cov=app --cov-report=html

# Run specific test file
python -m pytest test_db.py -v
```

### Frontend Testing
```bash
cd frontend

# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run e2e tests (if configured)
npm run test:e2e
```

### Load Testing
```bash
# Install artillery
npm install -g artillery

# Run load test
artillery run load-test.yml

# Generate report
artillery report report.json
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/new-game-type`
3. Make your changes and add tests
4. Ensure all tests pass: `npm test && python -m pytest`
5. Commit your changes: `git commit -am 'Add new game type'`
6. Push to the branch: `git push origin feature/new-game-type`
7. Submit a pull request

### Code Standards
- **Backend**: Follow PEP 8 style guide
- **Frontend**: Use ESLint and Prettier
- **Commits**: Use conventional commit format
- **Tests**: Maintain >80% code coverage

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue on GitHub
- Contact the development team
- Check the documentation in `/docs`

## 🔄 Roadmap

### Phase 1 (Current)
- ✅ Basic game types (Draw, Pool, Blackjack)
- ✅ Wallet system with demo currency
- ✅ Tournament brackets
- ✅ AI opponents

### Phase 2 (Next)
- 🔄 Real M-Pesa integration
- 🔄 Advanced tournament features
- 🔄 Mobile app development
- 🔄 Social features (friends, chat)

### Phase 3 (Future)
- 🔄 Live streaming integration
- 🔄 Advanced analytics
- 🔄 Multi-region deployment
- 🔄 Machine learning for AI improvement

---

**Built with ❤️ for the gaming community**