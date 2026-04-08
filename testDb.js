require("dotenv").config();
const mysql = require("mysql2/promise");

async function testConnection() {
  try {
    const conn = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
      port: process.env.DB_PORT,
    });
    console.log("✅ Connected to database!");
    await conn.end();
  } catch (err) {
    console.error("❌ Connection failed:", err.message);
  }
}

testConnection();
