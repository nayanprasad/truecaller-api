## Disclaimer

1. This project name is not related to any existing application or service.

2. The tech stack used in this project does not limit my expertise in other technologies. I am proficient in various programming languages, frameworks, and tools beyond what is demonstrated here and willing to master other framework as well.

3. I have added comprehensive documentation and code comments throughout the project. If you have any questions or need clarification, please feel free to contact me at [nayanprasad096@gmail.com](mailto:nayanprasad096@gmail.com).


# Truecaller API

A robust REST API service that provides phone number lookup, contact management, and spam detection functionality.

## Project Overview

This API service allows users to:
- Register and authenticate with phone numbers
- Search for contacts by name or phone number
- Get detailed information about phone numbers
- Manage personal contacts
- Report and identify spam numbers

## Tech Stack

- **Backend**: Node.js with Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **API Documentation**: Swagger/OpenAPI
- **Containerization**: Docker
- **Authentication**: Custom token-based authentication
- **Rate Limiting**: Redis-based rate limiting
- **Validation**: Zod for request validation

## Features

### Authentication
- User registration with phone number
- Secure login with password
- Session management

### Contact Management
- Add, update, list, and delete contacts

### Lookup Services
- Search contacts by name
- Search contacts by phone number
- Get detailed information about a phone number

### Spam Protection
- Report numbers as spam
- Check spam likelihood for numbers
- Spam score calculation based on community reports

### Performance Optimizations
- Redis caching for frequently accessed data
- Rate limiting to prevent abuse
- Pagination for search results

## API Documentation

The API is fully documented using Swagger. When the server is running, you can access the interactive API documentation at:

```
http://localhost:8080/api-docs
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Application environment: DEVELOPMENT or PRODUCTION
# Controls various optimizations and security features
NODE_ENV=DEVELOPMENT

# Port on which the server will run
PORT=8080

# Session token validity period in seconds (30 days)
# Controls how long a user stays logged in before requiring re-authentication
SESSION_TTL=2592000

# PostgreSQL database connection string
# Format: postgresql://[user]:[password]@[host]:[port]/[database]
DATABASE_URL=postgresql://admin:password@localhost:5432/truecaller_db

# Redis connection string for caching and rate limiting
# Format: redis://[host]:[port]
REDIS_URL=redis://localhost:6379

# Redis cache time-to-live in seconds (1 hour)
# Controls how long cached data remains valid
REDIS_TTL=3600

# Rate limiting window in seconds (1 minute)
# Defines the time period for rate limiting
REDIS_RATE_LIMIT_WINDOW=60

# Maximum number of requests allowed per window
# Controls how many API calls a user can make within the rate limit window
REDIS_RATE_LIMIT_MAX=100

```

## Docker Setup

### Development Environment

The project includes Docker configuration for setting up the development environment with PostgreSQL, Redis, and pgAdmin.

1. Start the development environment:

```bash
cd docker
docker-compose up -d
```

This will start:
- PostgreSQL database on port 5432
- Redis on port 6379
- pgAdmin web interface on port 5050

### Production Deployment

For production deployment, you can build and run the application container:

1. Build the Docker image:

```bash
docker build -t truecaller-api -f docker/Dockerfile .
```

2. Run the container:

```bash
docker run -p 8080:8080 --env-file .env truecaller-api
```

## Local Development

### Prerequisites

- Node.js (v20 or later)
- npm
- PostgreSQL (if running locally)
- Redis (if running locally)

### Setup

1. Clone the repository:

```bash
git clone <repository-url>
cd truecaller-api
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp example.env .env
# Edit .env with your configuration
```

4. Generate Prisma client, run migrations, and seed the database:

```bash
npm run setup
```

### Running the Application

#### Development Mode

```bash
npm run dev
```

This starts the application with hot reloading using tsx.

#### Production Mode

```bash
npm run build
npm start
```

## Database Schema

The application uses the following data models:

### User
- Stores registered user information
- Contains name, phone number, email, and password hash

### Contact
- Represents a user's contacts
- Links to User model if the contact is also a registered user

### SpamReport
- Tracks spam reports submitted by users
- Used to calculate spam likelihood for phone numbers

### Session
- Manages authentication sessions
- Stores tokens with expiration times

## Performance Considerations

- API responses are cached using Redis to improve performance
- Rate limiting is applied to prevent abuse
- Database queries are optimized with appropriate indexes
- Pagination is implemented for all list endpoints

## Security Features

- Password hashing for secure storage
- Token-based authentication
- Rate limiting to prevent brute force attacks
- Input validation using Zod
- Helmet middleware for HTTP security headers
