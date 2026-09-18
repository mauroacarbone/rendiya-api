# RendiYa API

[![Node.js](https://img.shields.io/badge/Node.js-Express-339933?logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![MySQL](https://img.shields.io/badge/MySQL-Sequelize-4479A1?logo=mysql&logoColor=white)](https://www.mysql.com/)
[![Auth](https://img.shields.io/badge/Auth-JWT-000000?logo=jsonwebtokens&logoColor=white)](https://jwt.io/)
[![Docs](https://img.shields.io/badge/Docs-Swagger_UI-85EA2D?logo=swagger&logoColor=black)](http://localhost:3001/api-docs)

A production-ready RESTful API built with Node.js, Express, MySQL, and Sequelize. RendiYa provides secure authentication and reservation management with standardized JSON responses and interactive OpenAPI documentation.

## Tech Stack

| Layer | Technology |
| --- | --- |
| Runtime | Node.js |
| HTTP framework | Express |
| Database | MySQL |
| ORM | Sequelize |
| Authentication | JWT |
| Password hashing | bcryptjs |
| Cross-origin | CORS |
| Documentation | Swagger UI (`swagger-autogen`) |

## Project Architecture

```text
rendiya-api/
├── config/
│   ├── config.json
│   └── database.js
├── controllers/
│   ├── authController.js
│   └── reservationController.js
├── middlewares/
│   └── authMiddleware.js
├── models/
│   ├── index.js
│   ├── Reservation.js
│   └── User.js
├── routes/
│   ├── authRoutes.js
│   └── reservationRoutes.js
├── index.js
├── swagger.js
├── .env.example
├── .gitignore
└── package.json
```

The API follows a layered layout: routes dispatch to controllers, controllers talk to Sequelize models, and `authMiddleware` protects reservation endpoints with Bearer tokens.

## Key Features

- **Secure authentication** using JWT and password hashing via bcryptjs.
- **Role-based data access** (users manage their own reservations; admins can access all records).
- **Standardized JSON API responses** in the shape `{ success, data, message }`.
- **Interactive API documentation** powered by Swagger.

## Environment Variables

Copy `.env.example` to `.env` and fill in local values. Never commit secrets.

```env
DB_NAME=rendiya
DB_USER=root
DB_PASS=your_mysql_password
DB_HOST=localhost
PORT=3001
JWT_SECRET=replace_with_a_long_random_secret
JWT_EXPIRES_IN=8h
```

## Getting Started

1. Install dependencies:

```bash
npm install
```

2. Create a `.env` file from the example above, then generate Swagger documentation (required before the first start):

```bash
npm run swagger
```

3. Start the development server. On boot the API creates the MySQL database if it is missing and syncs Sequelize models:

```bash
npm run dev
```

The server listens on `http://localhost:3001` by default.

## API Documentation

When the server is running locally, Swagger UI is available at [http://localhost:3001/api-docs](http://localhost:3001/api-docs).

| Method | Path | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | No | Register a user |
| `POST` | `/api/auth/login` | No | Sign in and receive a JWT |
| `GET` | `/api/reservations` | Bearer | List reservations |
| `GET` | `/api/reservations/:id` | Bearer | Get a reservation |
| `POST` | `/api/reservations` | Bearer | Create a reservation |
| `PUT` | `/api/reservations/:id` | Bearer | Update a reservation |
| `DELETE` | `/api/reservations/:id` | Bearer | Delete a reservation |

Send authenticated requests with `Authorization: Bearer <token>`.
