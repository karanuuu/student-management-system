const express = require("express");
const cors = require('cors');
const dotenv = require("dotenv");

const app = express();

// Middleware to parse JSON
app.use(cors());
app.use(express.json());

app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/tasks', require('./routes/taskRoutes'));


// Base route
app.get('/', (req, res) => {
  res.json({ message: 'Student Assignment Manager API is running!' });
});

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
