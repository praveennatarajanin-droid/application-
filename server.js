
const express = require('express');
const sqlite = require('better-sqlite3');
const multer = require('multer');
const path = require('path');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;

// Ensure uploads directory exists
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static('public'));
app.use('/uploads', express.static('uploads'));

// Database Initialization (SQLite)
const db = new sqlite('database.db');

// Auto-create Tables
function initDB() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS students (
      id INTEGER PRIMARY KEY,
      registration_no TEXT DEFAULT '5800',
      academic_year TEXT,
      class_registered TEXT,
      name_english TEXT,
      name_tamil TEXT,
      dob_day INTEGER,
      dob_month INTEGER,
      dob_year INTEGER,
      gender TEXT,
      blood_group TEXT,
      nationality TEXT,
      religion TEXT,
      caste TEXT,
      community TEXT,
      aadhar_no TEXT,
      address TEXT,
      contact_no TEXT,
      email TEXT,
      mother_tongue TEXT,
      other_languages TEXT,
      previous_school_name TEXT,
      previous_school_class TEXT,
      previous_school_year TEXT,
      emis_no TEXT,
      id_mark_1 TEXT,
      id_mark_2 TEXT,
      medical_history TEXT,
      status TEXT DEFAULT 'Pending',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS parents (
      id INTEGER PRIMARY KEY,
      student_id INTEGER,
      relation TEXT,
      name TEXT,
      dob TEXT,
      qualification TEXT,
      occupation TEXT,
      office_name TEXT,
      office_address TEXT,
      mobile_landline TEXT,
      monthly_income TEXT,
      aadhar_no TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS associations (
      id INTEGER PRIMARY KEY,
      student_id INTEGER,
      type TEXT,
      name TEXT,
      year_or_std TEXT,
      dept_unit_school TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY,
      student_id INTEGER,
      doc_type TEXT,
      file_path TEXT,
      FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
    );
  `);
  console.log('SQLite Database Initialized and Tables Ready');
}
// Note: SQLite PRIMARY KEY implies AUTOINCREMENT but if you use INTEGER PRIMARY KEY it's autoinc. 
// Standard SQLite syntax for autoinc is: id INTEGER PRIMARY KEY
// Wait, SQLite doesn't use AUTO_INCREMENT, it uses AUTOINCREMENT if you really want it, 
// but INTEGER PRIMARY KEY is enough. I'll correct it.

initDB();

// Migration: Add status and registration_no if not present
try {
  db.prepare("ALTER TABLE students ADD COLUMN status TEXT DEFAULT 'Pending'").run();
} catch (e) { /* Already exists */ }
try {
  db.prepare("ALTER TABLE students ADD COLUMN registration_no TEXT").run();
} catch (e) { /* Already exists */ }

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}_${file.originalname}`);
  }
});

const upload = multer({ storage: storage });

// API Endpoint for Form Submission
app.post('/api/register', upload.fields([
  { name: 'photo', maxCount: 1 },
  { name: 'aadhar_copy', maxCount: 1 },
  { name: 'birth_cert', maxCount: 1 },
  { name: 'community_cert', maxCount: 1 },
  { name: 'transfer_cert', maxCount: 1 }
]), (req, res) => {
  const insertTransaction = db.transaction(() => {
    try {
      const studentData = JSON.parse(req.body.student);
      const parentsData = JSON.parse(req.body.parents);
      const associationsData = JSON.parse(req.body.associations);

      // Generate Registration No (MCC-YYYY-XXXX)
      const year = new Date().getFullYear();
      const count = db.prepare('SELECT COUNT(*) as total FROM students').get().total + 1;
      const regNo = `MCC-${year}-${String(count).padStart(4, '0')}`;

      // 1. Insert Student Record
      const insertStudent = db.prepare(`
        INSERT INTO students (
          registration_no, academic_year, class_registered, name_english, name_tamil,
          dob_day, dob_month, dob_year, gender, blood_group,
          nationality, religion, caste, community, aadhar_no,
          address, contact_no, email, mother_tongue, other_languages,
          previous_school_name, previous_school_class, previous_school_year,
          emis_no, id_mark_1, id_mark_2, medical_history
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const studentResult = insertStudent.run(
        regNo, studentData.academic_year, studentData.class_registered, studentData.name_english, studentData.name_tamil,
        studentData.dob_day, studentData.dob_month, studentData.dob_year, studentData.gender, studentData.blood_group,
        studentData.nationality, studentData.religion, studentData.caste, studentData.community, studentData.aadhar_no,
        studentData.address, studentData.contact_no, studentData.email, studentData.mother_tongue, studentData.other_languages,
        studentData.school_earlier_name, studentData.school_earlier_class, studentData.school_earlier_year,
        studentData.emis_no, studentData.id_mark_1, studentData.id_mark_2, studentData.medical_history
      );

      const studentId = studentResult.lastInsertRowid;

      // 2. Insert Parent Records
      const insertParent = db.prepare(`
        INSERT INTO parents (
          student_id, relation, name, dob, qualification, occupation,
          office_name, office_address, mobile_landline, monthly_income, aadhar_no
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const parent of parentsData) {
        insertParent.run(
          studentId, parent.relation, parent.name, parent.dob, parent.qualification, parent.occupation,
          parent.office_name, parent.office_address, parent.mobile_landline, parent.monthly_income, parent.aadhar_no
        );
      }

      // 3. Insert Associations
      const insertAssoc = db.prepare(`
        INSERT INTO associations (student_id, type, name, year_or_std, dept_unit_school)
        VALUES (?, ?, ?, ?, ?)
      `);

      for (const assoc of associationsData) {
        if (assoc.name || assoc.dept_unit_school) {
          insertAssoc.run(studentId, assoc.type, assoc.name, assoc.year_or_std, assoc.dept_unit_school);
        }
      }

      // 4. Record Document Paths
      const files = req.files;
      const documentTypes = {
        'photo': 'Passport Size Photo',
        'aadhar_copy': 'Aadhar Card Copy',
        'birth_cert': 'Birth Certificate',
        'community_cert': 'Community Certificate',
        'transfer_cert': 'Transfer Certificate'
      };

      const insertDoc = db.prepare(`
        INSERT INTO documents (student_id, doc_type, file_path)
        VALUES (?, ?, ?)
      `);

      for (const [key, val] of Object.entries(documentTypes)) {
        if (files[key]) {
          insertDoc.run(studentId, val, files[key][0].path);
        }
      }

      return studentId;
    } catch (err) {
      throw err;
    }
  });

  try {
    const studentId = insertTransaction();
    res.status(200).json({ success: true, message: 'Registration Successful', studentId });
  } catch (err) {
    console.error('Error during registration:', err);
    res.status(500).json({ success: false, message: 'Registration Failed' });
  }
});


// --- ADMIN ROUTES (Surgical Addition) ---

// Admin Login
app.post('/api/admin/login', (req, res) => {
  const { email, password } = req.body;
  if (email === 'admin@mcc.com' && password === 'admin123') {
    res.json({ success: true, token: 'mcc-admin-token-2026' });
  } else {
    res.status(401).json({ success: false, message: 'Invalid credentials' });
  }
});

// Dashboard Stats
app.get('/api/admin/stats', (req, res) => {
  try {
    const total = db.prepare('SELECT COUNT(*) as count FROM students').get().count;
    const pending = db.prepare("SELECT COUNT(*) as count FROM students WHERE status = 'Pending'").get().count;
    const today = db.prepare("SELECT COUNT(*) as count FROM students WHERE date(created_at) = date('now')").get().count;
    res.json({ total, pending, today });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// All Applications
app.get('/api/admin/applications', (req, res) => {
  try {
    const apps = db.prepare('SELECT * FROM students ORDER BY created_at DESC').all();
    res.json(apps);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Single Application Detailed
app.get('/api/admin/application/:id', (req, res) => {
  try {
    const id = req.params.id;
    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(id);
    if (!student) return res.status(404).json({ message: 'Not found' });

    const parents = db.prepare('SELECT * FROM parents WHERE student_id = ?').all(id);
    const associations = db.prepare('SELECT * FROM associations WHERE student_id = ?').all(id);
    const documents = db.prepare('SELECT * FROM documents WHERE student_id = ?').all(id);

    res.json({ student, parents, associations, documents });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
