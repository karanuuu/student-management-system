const connection = require('./config/db'); // uses your db.js setup

connection.query('SELECT 1', (err, results) => {
  if (err) throw err;
  console.log('Database connection works:', results);
  connection.end();
});