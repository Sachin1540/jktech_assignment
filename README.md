# JK Tech NestJS API

This is a modular NestJS-based backend application with integrated authentication, User Management, Document Management,Ingestion Management and PostgreSQL database support — fully Dockerized and ready for CI/CD deployment.

---

## Features

- Modular architecture using NestJS
- JWT-based Authentication with Role-based access control
- User management APIs
- Doument Management APIs
- Ingestion Management APIs
- File upload with Multer
- Swagger API documentation
- PostgreSQL integration using TypeORM
- Docker and Docker Compose support
- Environment-based configuration
- Ready for CI/CD

---

## Technologies Used

- NestJS
- PostgreSQL
- TypeORM
- JWT Auth
- Multer (file uploads)
- Swagger
- Docker & Docker Compose

---

## 🚀 Getting Started (with Docker)

### 1. Clone the Repository

```bash
git clone https://github.com/Sachin1540/jktech_assignment.git
cd jktech_assignment

### 2. Clone the Repository
docker-compose up --build

Running Without Docker (Optional)
If you prefer to run locally:


# Install dependencies
npm install

# Start PostgreSQL manually or with Docker
# Update .env with DB connection

# Run the server
npm run start:dev || nest start --watch

API Documentation
Once the server is running, go to:

http://localhost:8080/swagger/api



```
