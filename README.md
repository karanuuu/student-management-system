# Member 4 — Backend Tasks API

## My Role

I built the task management backend API using Node.js, Express.js.

## My API Endpoints

| Method | Endpoint                | Description         |
| ------ | ----------------------- | ------------------- |
| POST   | /api/tasks              | Create a new task   |
| GET    | /api/tasks              | Get all tasks       |
| GET    | /api/tasks/:id          | Get single task     |
| PUT    | /api/tasks/:id          | Update task         |
| PUT    | /api/tasks/:id/status   | Update task status  |
| DELETE | /api/tasks/:id          | Delete task         |
| POST   | /api/tasks/:id/assign   | Assign task to user |
| POST   | /api/tasks/:id/comments | Add comment to task |
| GET    | /api/tasks/:id/comments | Get all comments    |

## How To Run

1. Install dependencies — npm install
2. Create a .env file with these values:
   - DB_HOST=localhost
   - DB_USER=your_mysql_username
   - DB_PASSWORD=your_mysql_password
   - DB_NAME=assignment_manager
   - JWT_SECRET=your_jwt_secret
   - PORT=5000
3. Run the server — npm run dev

## Dependencies

- express
- mysql2
- jsonwebtoken
- bcryptjs
- dotenv
- cors
- nodemon

## Status

- All 9 endpoints tested and working in Postman
- Date formatting in East Africa Time Nairobi
- Error handling for all edge cases
- Completed my part as member 4
