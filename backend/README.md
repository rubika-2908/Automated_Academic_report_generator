# Automated Academic Report Generator - Backend API

## Tech Stack
- Node.js
- Express.js
- MongoDB
- Mongoose

## Folder Structure
```text
backend/
  config/
    db.js
  controllers/
    authController.js
    recordController.js
    healthController.js
  middleware/
    authMiddleware.js
    validators.js
    securityHeaders.js
    requestLogger.js
    errorHandler.js
  models/
    User.js
    AcademicRecord.js
  postman/
    Academic_Report_Backend_API.postman_collection.json
    Academic_Report_Local.postman_environment.json
  routes/
    apiRoutes.js
    authRoutes.js
    recordRoutes.js
  utils/
    token.js
  .env.example
  server.js
```

## Setup
1. Create `.env` inside `backend`:
```env
PORT=5000
MONGO_URI=mongodb://127.0.0.1:27017/academic_report_db
JWT_SECRET=replace_with_a_strong_secret_key
```
2. Install packages:
```bash
npm install
```
3. Run server:
```bash
npm start
```

Base URL: `http://localhost:5000/api`

## Endpoints

### Health
`GET /health`

### Authentication APIs
`POST /auth/register`
`POST /auth/login`

### Academic Record APIs
`GET /records`
`GET /records/:id`
`POST /records`
`PUT /records/:id`
`DELETE /records/:id`
`POST /records/seed/bulk`

Note: Record APIs require `Authorization: Bearer <token>` header from login/register response.

## Postman / Thunder Client
Use the ready-made collection files in `backend/postman`.

### Files
- `backend/postman/Academic_Report_Backend_API.postman_collection.json`
- `backend/postman/Academic_Report_Local.postman_environment.json`

### Run in Postman
1. Import both files.
2. Select environment: `Academic Report Local`.
3. Run backend (`npm start`).
4. Run the full collection.

## Security and Validation
- JWT auth middleware protects record routes (`middleware/authMiddleware.js`).
- Passwords are hashed using `bcrypt` (with legacy SHA-256 login auto-upgrade support).
- Input validation middleware:
  - `validateRegisterInput`
  - `validateLoginInput`
  - `validateRecordInput`
  - `validateMongoIdParam`
- Basic secure headers middleware (`middleware/securityHeaders.js`).
- Basic request logging (`middleware/requestLogger.js`).
- Centralized 404 and error handlers (`middleware/errorHandler.js`).

## Backend API Development Checklist
- RESTful routes implemented for auth and records.
- Protected CRUD with token auth and ownership checks.
- Input validation with clear 400 responses.
- Standardized 401/403/404/500 responses.
- Postman collection with executable assertions for core flow.




  
