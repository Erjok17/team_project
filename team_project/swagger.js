const swaggerAutogen = require('swagger-autogen')({
  openapi: '2.0',
  autoHeaders: false,
  autoQuery: false,
  autoBody: false
});

const doc = {
  swagger: '2.0',
  info: {
    title: 'Bookstore API',
    version: '1.0.0',
    description: 'API for managing users and books'
  },
  host: 'localhost:3000',
  schemes: ['http', 'https'],
  tags: [
    { name: 'Users', description: 'User CRUD operations' },
    { name: 'Books', description: 'Book CRUD operations' }
  ],
  securityDefinitions: {
    githubAuth: {
      type: 'oauth2',
      authorizationUrl: 'https://github.com/login/oauth/authorize',
      tokenUrl: 'https://github.com/login/oauth/access_token',
      flow: 'accessCode',
      scopes: {
        'user:email': 'Access GitHub email'
      }
    }
  },
  definitions: {
    User: {
      type: 'object',
      required: ['firstName', 'lastName', 'email'],
      properties: {
        firstName: { 
          type: 'string',
          example: 'John',
          description: "User's first name"
        },
        lastName: { 
          type: 'string',
          example: 'Doe',
          description: "User's last name"
        },
        email: { 
          type: 'string',
          format: 'email',
          example: 'john.doe@example.com',
          description: "User's email address"
        },
        role: {
          type: 'string',
          enum: ['user', 'admin'],
          default: 'user',
          description: "User's role"
        }
      }
    },
    Book: {
      type: 'object',
      required: ['title', 'author', 'price'],
      properties: {
        title: { 
          type: 'string',
          example: 'The Great Gatsby',
          description: "Book title"
        },
        author: { 
          type: 'string',
          example: 'F. Scott Fitzgerald',
          description: "Book author"
        },
        price: { 
          type: 'number',
          format: 'float',
          example: 12.99,
          description: "Book price"
        },
        stock: {
          type: 'integer',
          example: 50,
          description: "Copies in stock"
        }
      }
    }
  },
  paths: {
    '/users': {
      get: {
        tags: ['Users'],
        summary: 'Get all users',
        responses: {
          200: {
            description: 'List of users',
            schema: {
              type: 'array',
              items: { $ref: '#/definitions/User' }
            }
          }
        }
      },
      post: {
        tags: ['Users'],
        summary: 'Create a user',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [{
          name: 'user',
          in: 'body',
          required: true,
          schema: { $ref: '#/definitions/User' }
        }],
        responses: {
          201: {
            description: 'User created',
            schema: { $ref: '#/definitions/User' }
          },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/users/{id}': {
      get: {
        tags: ['Users'],
        summary: 'Get user by ID',
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          type: 'string',
          description: 'User ID'
        }],
        responses: {
          200: {
            description: 'User details',
            schema: { $ref: '#/definitions/User' }
          },
          404: { description: 'User not found' }
        }
      },
      put: {
        tags: ['Users'],
        summary: 'Update user',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
            description: 'User ID'
          },
          {
            name: 'user',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/User' }
          }
        ],
        responses: {
          200: {
            description: 'User updated',
            schema: { $ref: '#/definitions/User' }
          },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' }
        }
      },
      delete: {
        tags: ['Users'],
        summary: 'Delete user',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          type: 'string',
          description: 'User ID'
        }],
        responses: {
          204: { description: 'User deleted' },
          401: { description: 'Unauthorized' },
          404: { description: 'User not found' }
        }
      }
    },
    '/books': {
      get: {
        tags: ['Books'],
        summary: 'Get all books',
        responses: {
          200: {
            description: 'List of books',
            schema: {
              type: 'array',
              items: { $ref: '#/definitions/Book' }
            }
          }
        }
      },
      post: {
        tags: ['Books'],
        summary: 'Create a book',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [{
          name: 'book',
          in: 'body',
          required: true,
          schema: { $ref: '#/definitions/Book' }
        }],
        responses: {
          201: {
            description: 'Book created',
            schema: { $ref: '#/definitions/Book' }
          },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' }
        }
      }
    },
    '/books/{id}': {
      get: {
        tags: ['Books'],
        summary: 'Get book by ID',
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          type: 'string',
          description: 'Book ID'
        }],
        responses: {
          200: {
            description: 'Book details',
            schema: { $ref: '#/definitions/Book' }
          },
          404: { description: 'Book not found' }
        }
      },
      put: {
        tags: ['Books'],
        summary: 'Update book',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [
          {
            name: 'id',
            in: 'path',
            required: true,
            type: 'string',
            description: 'Book ID'
          },
          {
            name: 'book',
            in: 'body',
            required: true,
            schema: { $ref: '#/definitions/Book' }
          }
        ],
        responses: {
          200: {
            description: 'Book updated',
            schema: { $ref: '#/definitions/Book' }
          },
          400: { description: 'Invalid input' },
          401: { description: 'Unauthorized' },
          404: { description: 'Book not found' }
        }
      },
      delete: {
        tags: ['Books'],
        summary: 'Delete book',
        security: [{ githubAuth: ['user:email'] }],
        parameters: [{
          name: 'id',
          in: 'path',
          required: true,
          type: 'string',
          description: 'Book ID'
        }],
        responses: {
          204: { description: 'Book deleted' },
          401: { description: 'Unauthorized' },
          404: { description: 'Book not found' }
        }
      }
    }
  }
};

const outputFile = './swagger.json';
const fs = require('fs');

fs.writeFileSync(outputFile, JSON.stringify(doc, null, 2));
console.log('✅ Swagger documentation generated successfully!');