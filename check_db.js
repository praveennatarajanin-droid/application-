
const Database = require('better-sqlite3');
const db = new Database('database.db');
try {
  const students = db.prepare('SELECT * FROM students').all();
  console.log('STUDENTS COUNT:', students.length);
  console.log('STUDENT DATA:', JSON.stringify(students[0], null, 2));
} catch (e) {
  console.error(e);
}
db.close();
