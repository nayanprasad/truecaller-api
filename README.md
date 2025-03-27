## Disclaimer

1. This project is developed as a demonstration of technical capabilities and is not affiliated with, endorsed by, or connected to any commercial entity or service with a similar name

2. **The tech stack used in this project does not limit my expertise in other technologies. I am proficient in various programming languages, frameworks, and tools beyond what is demonstrated here and willing to master any other tool or framework as well.**

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
- **CI / CD**: GitHub Actions.
- **Version Control**: Git

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

## API Routes

### Base URL

All API endpoints are prefixed with `/api`.

### Authentication Routes

| Method | Endpoint         | Description                                               | Authentication Required |
|--------|------------------|-----------------------------------------------------------|-------------------------|
| POST   | `/auth/register` | Register a new user with name, phone number, and password | No                      |
| POST   | `/auth/login`    | Login with phone number and password                      | No                      |
| POST   | `/auth/logout`   | Logout and invalidate token                               | Yes                     |

### User Routes

All user routes require authentication with a valid JWT token.

| Method | Endpoint             | Description                      | Authentication Required |
|--------|----------------------|----------------------------------|-------------------------|
| GET    | `/user/profile`      | Get user profile information     | Yes                     |
| PATCH  | `/user/profile`      | Update user profile information  | Yes                     |
| GET    | `/user/contacts`     | Get all contacts with pagination | Yes                     |
| GET    | `/user/contacts/all` | Get all contacts                 | Yes                     |
| POST   | `/user/contacts/new` | Add a new contact                | Yes                     |
| GET    | `/user/contacts/:id` | Get a specific contact by ID     | Yes                     |
| PATCH  | `/user/contacts/:id` | Update a specific contact        | Yes                     | 
| DELETE | `/user/contacts/:id` | Delete a specific contact        | Yes                     |
| POST   | `/user/report-spam`  | Report a phone number as spam    | Yes                     |

### Lookup Routes

| Method | Endpoint                      | Description                                   | Authentication Required |
|--------|-------------------------------|-----------------------------------------------|-------------------------|
| GET    | `/lookup/search/name`         | Search for contacts by name                   | No                      |
| GET    | `/lookup/search/phone`        | Search for contacts by phone number           | No                      |
| GET    | `/lookup/phone/:phoneNumber`  | Get detailed information about a phone number | No                      |
| GET    | `/lookup/premium/search/name` | Premium feature: Search for contacts by name  | Yes                     |

### Request and Response Formats

All API endpoints return responses in JSON format with the following structure:

```json
{
   "success": true/false,
   "message": "Optional message",
   "data": {
      /* Response data */
   },
   "pagination": {
      /* Pagination info if applicable */
   }
}
```

### Authentication

Authentication is implemented using JWT (JSON Web Tokens). To access protected routes:

1. Obtain a token by registering or logging in
2. Include the token in the Authorization header of subsequent requests:
   ```
   Authorization: Bearer <your_token>
   ```

### Rate Limiting

The API implements rate limiting to prevent abuse:

- Authentication routes: 10 requests per minute
- Lookup routes: 100 requests per minute
- User routes: 100 requests per minute

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

## CI/CD Pipeline

Note: _This project is not publicly available on GitHub and not hosted on a live server. The CI/CD pipeline is for demonstration purposes only._

This project uses GitHub Actions for continuous integration and deployment:

- **Continuous Integration**: Automated testing and code quality checks on each push
- **Continuous Deployment**: Automated deployment to staging (main branch) and production (prod branch) environments
- **Docker Integration**: Builds and pushes Docker images to Docker Hub
- **EC2 Deployment**: Automatically deploys the latest image to EC2 instances

The CI/CD pipeline ensures that code changes are automatically tested, built, and deployed to the appropriate environment.
