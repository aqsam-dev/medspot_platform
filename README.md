# MedSpot

A full-stack healthcare platform connecting patients with nearby pharmacies to check real-time medicine availability and reserve prescriptions.

## Overview

MedSpot is organized as a monorepo containing multiple client applications backed by shared services — a pharmacy web portal, an admin portal, a patient-facing mobile app, and a point-of-sale system, all connecting to a common backend and a dedicated OCR service for reading prescriptions.

## Project Structure

```
medspot/
├── apps/
│   ├── admin_portal/          # Admin dashboard (React)
│   ├── mobile_app/            # Patient-facing mobile app (Flutter)
│   ├── pharmacy_pos/          # Point-of-sale system for pharmacies(React)
│   └── pharmacy_web_portal/   # Pharmacy staff web portal (React)
└── services/
    ├── medspot_service/       # Main backend API (Node.js/Express, PostgreSQL)
    ├── ocr_service/           # Prescription OCR pipeline (Python, EasyOCR)
    └── pos_service/           # POS backend(Node.js/Express,PostgreSQL)
```

## Tech Stack

React.js, Node.js, Express.js, PostgreSQL, Flutter, Python (FastAPI), EasyOCR, Socket.io

## Key Features

- Real-time medicine availability search across nearby pharmacies
- OCR pipeline that extracts medicine names and dosage from uploaded prescription images
- Role-based JWT authentication for patients and pharmacy staff
- Real-time reservation notifications via Socket.io
- Admin portal for platform-wide management
- Integrated point-of-sale system for in-pharmacy transactions

## Modules

- Patient mobile application (Flutter)
- Pharmacy web portal (React)
- Admin portal (React)
- Pharmacy POS
- Main backend API (Node.js/Express)
- OCR prescription service (Python/FastAPI)

## Running Locally

Each app/service has its own dependencies and environment variables.

1. Clone the repo
2. For each service in `services/`, copy `.env.example` to `.env` and fill in your own values
3. Install dependencies per app/service (see individual folder for `package.json` or `requirements.txt`)
4. Run each service/app individually — see folder-level instructions

*(Add exact run commands here once finalized, e.g. `cd services/medspot_service && npm install && npm run dev`)*

## About this project

Built as a hands-on full-stack project to explore real-world healthcare application development — including OCR integration, real-time systems, role-based access control, and coordinating multiple client applications around a shared backend.
