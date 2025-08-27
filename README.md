

# Transformer Inspection Management System

A web-based platform for power utilities to manage transformer inspections efficiently. The system enables automated detection of thermal anomalies, centralized management of transformer records and thermal images, and generation of digital maintenance records. It improves inspection accuracy, reduces manual effort, and ensures traceability across all inspection phases.

---

## Table of Contents
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Default Transformer Entries](#default-transformer-entries)
- [Usage Guide](#usage-guide)

---

## Overview

This application helps teams streamline their transformer maintenance and inspection processes. It provides a centralized interface to:
- Create and manage inspection entries.
- Track progress and mark inspections as completed.
- Automatically synchronize maintenance dates with inspected dates when inspections are completed.
- View, edit, and delete inspection entries with ease.

---

## Setup Instructions

1. **Clone the repository:**
   ```bash
   git clone https://github.com/DinethPrabashana/core4.git
   cd transformer-management-system

2. **Install dependencies:**

   `npm install`

**(optional)** Configure default transformer behavior:
Set the `add_default_entry` variable in the App.js script:

    true – preload sample transformers

    false – start with an empty database

3. **Start the development server:**

   `npm start`



## Data & Storage Usage

### Local Storage
The current version uses browser `localStorage` to persist transformer and inspection data between sessions.

- Inspection records, transformer lists, and their states are stored locally.
- This ensures fast loading and offline-friendly operation.

### Default Entries
A configuration variable (`add_default_entry`) controls whether default transformer data should be preloaded.

- `true`: Loads predefined transformers.
- `false`: Starts with an empty database.

### Future Plan – Database Integration
We aim to migrate from local storage to a structured database (e.g., SQL-based) in the next phase.

- This will enable multi-user access, centralized data management, and improved scalability.
- The planned backend will synchronize transformer and inspection data securely.

---

## Default Transformer Entries
This application supports optional default transformers to help with quick setup and testing during the initial phase.

- **Controlled via** the configuration variable: `add_default_entry`
- **Located in** the App.js file

**When enabled (`true`)**:

- Preloads a predefined list of transformers into the application.
- Useful for demonstrations, quick prototyping, or testing.

**When disabled (`false`)**:

- Starts with an empty transformer list.
- Suitable for production environments where only real transformer data should be added manually.

> **Note:** This behavior only affects the initial load of the application. Once custom data is added, it will persist in the browser `localStorage` until cleared or replaced.


## Usage Guide

1. Open the app in your browser (default: [http://localhost:3000](http://localhost:3000)).
2. Use the sidebar to navigate between:
   - **Transformers**
   - **Settings**
3. In the **Transformers** tab:
   - There are two sub-buttons:
     - **Transformers** – View and manage transformer records.
     - **Inspections** – View transformer inspection summaries.
   - **Add Transformer** button – Add a new transformer record.
4. In the **Inspections** view:
   - Displays a list of all transformers with their total number of inspections.
   - Clicking on a transformer shows detailed inspection records for that transformer.
5. Add or edit transformers and inspections as needed.
6. Mark inspections as complete to automatically sync the inspected date with the maintenance date.


