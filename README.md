# Thermal Image Anomaly Detection System

This project is a web-based application designed for the inspection of electrical transformers using thermal imaging. It leverages an AI-powered backend to analyze thermal images against a baseline, automatically detecting and classifying potential faults like loose joints and overloads.

The user-friendly interface allows inspectors to upload images, review AI-generated analysis, add their own manual annotations, and generate a comprehensive inspection report.

---

## Key Features

- **Image Comparison:** Upload and compare a standard "Baseline" image with a "Thermal" (maintenance) image.
- **Persistent Data Storage:** All transformer and inspection data is saved in a robust SQLite database.
- **AI-Powered Analysis:** A Python backend uses computer vision techniques (image alignment, color difference analysis) to automatically detect hot spots and other anomalies.
- **Anomaly Classification:** AI automatically classifies anomalies as `Faulty` or `Potentially Faulty` and identifies subtypes like `LooseJoint` or `PointOverload`.
- **Interactive Annotations:** View AI-detected anomalies as bounding boxes directly on the thermal image.
- **Manual Review & Annotation:**
    - Draw new bounding boxes to manually identify anomalies the AI may have missed.
    - For manually added boxes, classify them as `Faulty`, `Potentially Faulty`, or `Normal` using a simple dropdown.
    - Add comments or reasons for any anomaly, whether AI-detected or manual.
    - Delete incorrect or irrelevant anomaly detections.
- **Inspection Workflow:** Track the progress of an inspection from image upload to final review.

---

## Tech Stack

- **Frontend:** React.js
- **Backend:** Python with Flask, SQLite Database
- **Computer Vision:** OpenCV

---

## Project Structure

The project is divided into two main parts:

```text
/
├── backend/      # Contains the Python Flask server and all AI/CV logic
└── core4/        # Contains the React.js frontend application
```

---

## Setup and Installation Guide

To run this project on your local machine, you will need to set up both the backend server and the frontend application.

### Prerequisites

- **Node.js and npm:** Download & Install Node.js
- **Python 3.x and pip:** Download & Install Python

### 1. Backend Setup (Flask Server)

The backend is responsible for all image processing, AI analysis, and data persistence.

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Create and activate a virtual environment** (recommended):
    ```bash
    # For Windows
    python -m venv venv
    .\venv\Scripts\activate

    # For macOS/Linux
    python3 -m venv venv
    source venv/bin/activate
    ```

3.  **Install the required Python packages:**
    ```bash
    pip install Flask Flask-Cors numpy opencv-python scikit-image
    pip install requirements.txt
    ```

4.  **Initialize the database:**
    This command only needs to be run once. It will create the `backend.db` file and set up the necessary tables.
    ```bash
    python database.py
    ```

5.  **Run the backend server:**
    ```bash
    python app.py
    ```

    The server will start running on `http://localhost:8000`. Keep this terminal window open.

### 2. Frontend Setup (React App)

The frontend provides the user interface for interacting with the application.

1.  **Open a new terminal window.**

2.  **Navigate to the frontend directory:**
    ```bash
    cd core4
    ```

3.  **Install the required npm packages:**
    ```bash
    npm install
    ```

4.  **Run the frontend application:**
    ```bash
    npm start
    ```

    Your web browser should automatically open to `http://localhost:3000`, where you can now use the application. The frontend will communicate with the backend server you started in the other terminal.
