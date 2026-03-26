
CREATE DATABASE IF NOT EXISTS mcc_school_db;
USE mcc_school_db;

CREATE TABLE IF NOT EXISTS students (
  id INT AUTO_INCREMENT PRIMARY KEY,
  registration_no VARCHAR(20) DEFAULT '5800',
  academic_year VARCHAR(20),
  class_registered VARCHAR(100),
  name_english VARCHAR(255),
  name_tamil VARCHAR(255),
  dob_day INT,
  dob_month INT,
  dob_year INT,
  gender ENUM('Male', 'Female'),
  blood_group VARCHAR(10),
  nationality VARCHAR(50),
  religion VARCHAR(50),
  caste VARCHAR(100),
  community VARCHAR(100),
  aadhar_no VARCHAR(20),
  address TEXT,
  contact_no VARCHAR(20),
  email VARCHAR(100),
  mother_tongue VARCHAR(50),
  other_languages VARCHAR(255),
  previous_school_name VARCHAR(255),
  previous_school_class VARCHAR(50),
  previous_school_year VARCHAR(10),
  emis_no VARCHAR(50),
  id_mark_1 TEXT,
  id_mark_2 TEXT,
  medical_history TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS parents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  relation ENUM('Father', 'Mother'),
  name VARCHAR(255),
  dob VARCHAR(20),
  qualification VARCHAR(100),
  occupation VARCHAR(100),
  office_name VARCHAR(255),
  office_address TEXT,
  mobile_landline VARCHAR(50),
  monthly_income VARCHAR(50),
  aadhar_no VARCHAR(20),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS associations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  type ENUM('Staff', 'Alumni', 'Sibling'),
  name VARCHAR(255),
  year_or_std VARCHAR(50),
  dept_unit_school VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS documents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  student_id INT,
  doc_type VARCHAR(100),
  file_path VARCHAR(255),
  FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE
);
