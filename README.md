# Transformer Inspection Management System

A web-based application designed to manage transformer inspections, maintenance scheduling, and progress tracking efficiently. The system ensures that inspection records are properly updated, and when an inspection is marked as complete, the inspected date automatically reflects the recorded maintenance date.

---

## Table of Contents
- [Overview](#overview)
- [Setup Instructions](#setup-instructions)
- [Features](#features)
- [Project Architecture](#project-architecture)
- [Default Transformer Entries](#default-transformer-entries)
- [Usage Guide](#usage-guide)
- [Available Scripts](#available-scripts)
- [Deployment](#deployment)
- [Technologies Used](#technologies-used)
- [License](#license)

---

## Overview

This application helps teams streamline their transformer maintenance and inspection processes. It provides a centralized interface to:
- Create and manage inspection entries.
- Track progress and mark inspections as completed.
- Automatically synchronize maintenance dates with inspected dates when inspections are completed.
- View, edit, and delete inspection entries with ease.

---

## Setup Instructions  🚀 **(Start Here)**

1. **Clone the repository:**
   ```bash
   git clone <repository-url>
   cd transformer-management-system

Install dependencies:

npm install

Configure default transformer behavior (optional):
Set the add_default_entry variable in the initialization script:

    true – preload sample transformers

    false – start with an empty database

Start the development server:

npm start

Features

    Inspection Management: Add, view, edit, and delete inspections.

    Progress Tracking: Monitor inspections and update their completion status.

    Automated Date Handling: Automatically sets the inspected date to match the maintenance date upon completion.

    Search and Filter: Quickly find inspections based on transformer details or progress.

    Responsive UI: Works seamlessly on desktops and tablets.

Project Architecture

The project follows a modular React architecture to keep the code organized and scalable:

transformer-management-system/
├── src/
│   ├── components/
│   │   ├── InspectionList/          # Displays all inspections for selected transformers
│   │   ├── InspectionModal/         # Add/edit inspection form
│   │   ├── InspectionViewModal/     # View details and complete inspection
│   │   ├── SettingsPage/            # Application settings
│   │   ├── Sidebar/                 # Sidebar navigation
│   │   ├── Tabs/                    # Tab navigation for sections
│   │   ├── TransformerInspectionsPage/ # Combined transformer + inspections view
│   │   ├── TransformerList/         # List and manage transformers
│   │   └── TransformerModal/        # Add/edit transformer form
│   ├── App.js                       # Main application entry
│   └── styles/                      # CSS files
└── README.md

Data & Storage Usage

    Local Storage:
    The current version uses browser localStorage to persist transformer and inspection data between sessions.

        Inspection records, transformer lists, and their states are stored locally.

        This ensures fast loading and offline-friendly operation.

    Default Entries:
    A configuration variable (add_default_entry) controls whether default transformer data should be preloaded.

        true: Loads predefined transformers.

        false: Starts with an empty database.

    Future Plan – Database Integration:
    We aim to migrate from local storage to a structured database (e.g., SQL-based) in the next phase.

        This will enable multi-user access, centralized data management, and improved scalability.

        The planned backend will synchronize transformer and inspection data securely.

Default Transformer Entries

This application supports optional default transformers to help with quick setup and testing during the initial phase.

    Controlled via the configuration variable: add_default_entry

    Located in the project configuration or initialization file (typically where data is initialized)

    When enabled (true):

        Preloads a predefined list of transformers into the application.

        Useful for demonstrations, quick prototyping, or testing.

    When disabled (false):

        Starts with an empty transformer list.

        Suitable for production environments where only real transformer data should be added manually.

    Note: This behavior only affects the initial load of the application. Once custom data is added, it will persist in the browser localStorage until cleared or replaced.

Usage Guide

    Open the app in your browser (default: http://localhost:3000)

    Use the sidebar to navigate between:

        Transformer List

        Inspections

        Settings

    Add or edit transformers and inspections as needed.

    Mark inspections as complete to automatically sync the inspected date with the maintenance date.

