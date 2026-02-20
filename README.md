# CivicSense - Smart Civic Issue Reporting Platform

A full-stack platform for citizens to report, track, and resolve civic issues using real-time maps and smart GPS detection.

## Project Structure
- **/my-app**: React frontend (built with Leaflet, Tailwind CSS, and Recharts)
- **/backend**: Node.js & Express backend (MongoDB, Cloudinary for images, Nodemailer for notifications)

## Quick Start

### 1. Prerequisites
- Node.js (v18+)
- MongoDB (Local or Atlas)
- Cloudinary Account (for image uploads)

### 2. Backend Setup
```bash
cd backend
npm install
# Create a .env file based on .env.example
npm start
```

### 3. Frontend Setup
```bash
cd my-app
npm install
npm start
```

## Features
- **Interactive Leaflet Maps**: Real-time pinning and GPS auto-detection.
- **Smart Status Tracking**: Visual markers on the map (Green for Resolved, Orange for Pending).
- **Admin Dashboard**: Manage complaints and assign departments.
- **Data Insights**: Comprehensive analytics for city infrastructure health.

---
Built for Hackathon Project 2026.
