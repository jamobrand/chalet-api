# Chalet API Management# Chalet API Management

A comprehensive API for managing chalets and booking systems built with Node.js, Express, TypeScript, and Prisma.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Getting Started](#getting-started)
- [Environment Setup](#environment-setup)
- [Development Workflow](#development-workflow)
- [Database Management](#database-management)
- [Version Control & Releases](#version-control--releases)
- [Available Scripts](#available-scripts)
- [Project Structure](#project-structure)
- [Contributing](#contributing)

## Prerequisites

Before setting up the project, ensure you have the following installed:

- **Node.js** (v16 or higher)
- **npm** (v8 or higher)
- **Git**
- **PostgreSQL** (or your preferred database)

## Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/jamobrand/chalet-api.git
cd chalet-api
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env` file in the root directory and configure the following variables:

```env
# Application Settings
NODE_ENV=development
APP_ORIGIN=http://localhost:4500,http://localhost:4600
FRONTEND_URL=http://localhost:4500
PORT=6170
VERSION=0.1.0

# AWS S3 Configuration
AWS_S3_BUCKET=your-s3-bucket-name
AWS_REGION=your-aws-region
CLOUDFRONT_DOMAIN=your-cloudfront-domain
AWS_ACCESS_KEY_ID=your-access-key-id
AWS_SECRET_ACCESS_KEY=your-secret-access-key

# Email Configuration (Mailtrap for development)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_FROM=noreply@yourdomain.com
EMAIL_USERNAME=your-mailtrap-username
EMAIL_PASSWORD=your-mailtrap-password

# JWT Configuration
JWT_SECRET=your-super-secure-jwt-secret-key
JWT_SECRET_EXPIRE=1d

# Cookie Configuration
COOKIE_NAME=chalet-auth-token

# Database Configuration
DATABASE_URL=postgresql://username:password@localhost:5432/chalet_db

# Redis Configuration (for BullMQ)
REDIS_URL=redis://localhost:6379
```

### 4. Database Setup

Generate Prisma client and run migrations:

```bash
# Generate Prisma client
npm run prisma:generate

# Run database migrations
npm run prisma:migrate
```

### 5. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:6170`

## Environment Setup

### Development Environment

For development, ensure you have:

1. **Database**: Set up a local PostgreSQL instance
2. **AWS Credentials**: Configure AWS credentials for S3 file uploads
3. **Email Service**: Use Mailtrap for email testing in development

### Production Environment

For production deployment:

1. Set `NODE_ENV=production` in your environment
2. Use `npm run prisma:migrate:prod` instead of `npm run prisma:migrate`
3. Ensure all production credentials are properly configured
4. Use a production-ready database and Redis instance

## Development Workflow

### Running the Application

**Development Mode:**
```bash
npm run dev
```

**Production Build:**
```bash
npm run build
npm run start
```

### Code Quality

The project includes automated code quality tools:

```bash
# Run ESLint
npm run lint

# Fix ESLint issues automatically
npm run lint:fix

# Format code (runs automatically on commit via husky)
npx prettier --write .
```

## Database Management

### Schema Changes

When you modify the Prisma schema:

1. **Generate Prisma Client:**
   ```bash
   npm run prisma:generate
   ```

2. **Create and Apply Migration (Development):**
   ```bash
   npm run prisma:migrate
   ```

3. **Apply Migration (Production):**
   ```bash
   npm run prisma:migrate:prod
   ```

### Prisma Studio

To explore your database with a visual interface:

```bash
npx prisma studio
```

## Version Control & Releases

This project uses [Changesets](https://github.com/changesets/changesets) for version management and automated changelog generation.

### Feature Development Workflow

#### 1. Initialize Changesets (One-time setup)

```bash
npx changeset init
```

#### 2. Create Feature Branch

```bash
git checkout -b feature/your-feature-name
# Examples: feature/user-authentication, feature/booking-system, feature/payment-integration
```

#### 3. Develop Your Feature

Make your changes, write tests, and ensure everything works correctly.

#### 4. Create Changeset

Before committing your feature:

```bash
npx changeset
```

This will prompt you to:
- Select the type of change (patch, minor, major)
- Describe your changes
- Generate a changeset file

#### 5. Commit and Push Feature

```bash
git add .
git commit -m "feat: Add your feature description

- Detailed description of changes
- List of new endpoints or functionality
- Any breaking changes"

git push -u origin feature/your-feature-name
```

#### 6. Create Pull Request

1. Go to your GitHub repository
2. Click "Compare & pull request" for your feature branch
3. Fill in the PR description with:
   - What the feature does
   - Why it's needed
   - Any testing instructions
   - Screenshots (if applicable)
4. Assign reviewers and create the pull request

#### 7. Review and Merge

1. Address any review feedback
2. Once approved, merge the pull request
3. Delete the feature branch on GitHub

#### 8. Post-Merge Steps

```bash
# Switch back to main branch
git checkout main

# Pull latest changes
git pull origin main

# Delete local feature branch
git branch -d feature/your-feature-name
```

### Release Process

#### 1. Version Bump

```bash
npx changeset version
```

This updates `package.json` version and generates/updates `CHANGELOG.md`.

#### 2. Commit Release Changes

```bash
git add .
git commit -m "chore(release): prepare for version $(node -p "require('./package.json').version")"
```

#### 3. Create Git Tag

```bash
VERSION=$(node -p "require('./package.json').version")
git tag v$VERSION
git push origin v$VERSION
```

#### 4. Push Changes

```bash
git push origin main
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server with hot reload |
| `npm run build` | Build TypeScript to JavaScript |
| `npm run start` | Build and start production server |
| `npm run lint` | Run ESLint on source files |
| `npm run lint:fix` | Fix ESLint issues automatically |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations (development) |
| `npm run prisma:migrate:prod` | Deploy migrations (production) |

## Project Structure

```
chalet-api/
├── src/                    # Source code
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/            # Database models
│   ├── routes/            # API routes
│   ├── services/          # Business logic
│   ├── utils/             # Utility functions
│   └── index.ts           # Application entry point
├── prisma/                # Database schema and migrations
├── dist/                  # Compiled JavaScript (generated)
├── __test__/              # Test files
├── .changeset/            # Changeset configuration
├── .env                   # Environment variables
├── package.json           # Project dependencies and scripts
├── tsconfig.json          # TypeScript configuration
└── README.md              # This file
```

## API Documentation

### Base URL
- Development: `http://localhost:6170`
- Production: `https://your-domain.com`

### Authentication
The API uses JWT tokens for authentication. Include the token in the Authorization header:

```
Authorization: Bearer <your-jwt-token>
```

### Rate Limiting
API endpoints are rate-limited to prevent abuse. Current limits:
- General endpoints: 100 requests per 15 minutes
- Authentication endpoints: 5 requests per 15 minutes

## Contributing

1. Fork the repository
2. Create a feature branch following the naming convention: `feature/description`
3. Follow the development workflow outlined above
4. Ensure all tests pass and code follows the established patterns
5. Submit a pull request with a clear description of changes

### Code Style

- Use TypeScript for all new code
- Follow the existing ESLint and Prettier configurations
- Write meaningful commit messages following conventional commit format
- Include JSDoc comments for public functions and classes

## Support

For questions or issues:

1. Check existing [GitHub Issues](https://github.com/jamobrand/chalet-api/issues)
2. Create a new issue with detailed description
3. Contact the maintainer: James Kariuki

## License

This project is UNLICENSED. See the package.json file for details.