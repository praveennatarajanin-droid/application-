
# MCC School Admission Form Digitization (Zero Setup Edition)

A full-stack web application that replicates the MCC Campus Matriculation Higher Secondary School registration form. 

**This version uses SQLite for zero external database setup.**

## Quick Start (No Configuration Required)

1.  **Install Dependencies**:
    ```bash
    npm install
    ```

2.  **Run the Server**:
    ```bash
    node server.js
    ```
    The application will be instantly available at `http://localhost:3000`.

## Key Features
-   **No DB Installation**: Uses a local `database.db` file created automatically.
-   **Instant Tables**: Database tables are created on startup.
-   **Maroon Theme**: Exact visual replica of the school form.
-   **Document Uploads**: Handled via Multer and stored in `/uploads`.

## Tech Stack
-   **Frontend**: HTML5, CSS3, Vanilla JS
-   **Backend**: Node.js, Express, better-sqlite3
-   **File Handler**: Multer
