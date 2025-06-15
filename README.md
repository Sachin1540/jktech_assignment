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

## Getting Started

### Clone the Repository

git clone https://github.com/Sachin1540/jktech_assignment.git
cd jktech_assignment

### Running With Docker

docker-compose up --build

## Running Without Docker (Optional)

### 1. Install dependencies

npm install

### 2. Start PostgreSQL manually or with Docker

Or run `docker-compose up postgres` separately.

### 3. Run the app

npm run start:dev || nest start --watch

### 4. Run the test cases

npm run test:cov

---

## API Documentation

### Swagger

Once the server is running, go to:
http://localhost:8080/swagger/api

---

## Screenshots

### Swagger AAPI Documentation

![Swagger AAPI Documentation](./screenshots/Swagger%20Api%20Documentation.png)

### Docker desktop terminal

![Docker desktop terminal](./screenshots/docker%20desktop%20terminal.png)

### Test Case Coverage

## ![Test Case coverage](./screenshots/Test%20cases%20coverage.png)

## ![Short Video Demonstration](./screenshots/assignment-recording.webm)