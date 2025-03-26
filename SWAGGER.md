# Swagger API Documentation

This document explains how to use and extend the Swagger API documentation in the Truecaller API project.

## Accessing the Documentation

Once the server is running, you can access the Swagger documentation at:

```
http://localhost:8080/api-docs
```

This interactive UI allows you to:
- Browse all available API endpoints
- See request parameters and response schemas
- Test API endpoints directly from the browser

## How It Works

The Swagger documentation is generated from:

1. JSDoc comments in your route files
2. The Swagger configuration in `src/config/swagger.ts`

## Adding Documentation to New Routes

To document a new API endpoint, add JSDoc comments above your route definitions following this pattern:

```typescript
/**
 * @swagger
 * /path/to/endpoint:
 *   method:
 *     summary: Brief description
 *     tags: [Category]
 *     parameters:
 *       - in: path/query/header/body
 *         name: paramName
 *         schema:
 *           type: string/number/boolean/object/array
 *         required: true/false
 *         description: Parameter description
 *     responses:
 *       200:
 *         description: Success response description
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 property1:
 *                   type: string
 *       400:
 *         description: Error response description
 */
```

## Defining Models

For complex data models that are reused across endpoints, you can define schemas in your model files:

```typescript
/**
 * @swagger
 * components:
 *   schemas:
 *     User:
 *       type: object
 *       required:
 *         - id
 *         - name
 *         - email
 *       properties:
 *         id:
 *           type: string
 *           description: The auto-generated ID
 *         name:
 *           type: string
 *           description: The user name
 *         email:
 *           type: string
 *           format: email
 *           description: The user email
 */
```

Then reference them in your route documentation:

```typescript
/**
 * @swagger
 * /users:
 *   get:
 *     summary: Returns a list of users
 *     responses:
 *       200:
 *         description: List of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 */
```

## Authentication

The Swagger configuration already includes a Bearer token authentication scheme. To mark an endpoint as requiring authentication, add the security section:

```typescript
/**
 * @swagger
 * /protected/endpoint:
 *   get:
 *     summary: Protected endpoint
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 *       401:
 *         description: Unauthorized
 */
```

## Customizing the Swagger UI

To customize the Swagger UI appearance or behavior, you can modify the setup options in `src/app.ts`:

```typescript
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(specs, {
    explorer: true,
    customCss: '.swagger-ui .topbar { display: none }',
    customSiteTitle: "Truecaller API Documentation",
  })
);
```

## Best Practices

1. Group related endpoints with the same tag
2. Provide detailed descriptions for parameters
3. Document all possible response codes
4. Include examples where helpful
5. Keep documentation in sync with code changes
