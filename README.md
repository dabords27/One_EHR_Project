
# Delivery & Labor Suite – Operative Technique Form System

A robust full-stack solution for medical record management in hospital settings.

## Getting Started Locally

### Prerequisites
- Node.js (v18 or higher)
- MySQL Server

### Database Setup
1. Create a database named `hospital_dl_suite` in your MySQL instance.
2. The system automatically handles table creation on the first run of the server.

### Installation
1. Clone the repository.
2. Install frontend dependencies: `npm install`
3. Create a `.env` file based on `.env.example` and fill in your database credentials.

### Running the App
1. **Frontend**: `npm run dev` (Runs on http://localhost:5173)
2. **Backend**: `node server.js` (Runs on http://localhost:5000)

## Security Roles
- **Nurse**: Create, Edit, View records.
- **Admin**: Create, Edit, View, and **Delete** records.

*Credentials for demo*:
- Admin: `admin` / `admin`
- Nurse: `nurse` / `nurse`

## Deployment Instructions

### Frontend (SPA)
1. Run `npm run build` to generate the production `dist` folder.
2. Deploy to platforms like Vercel, Netlify, or Hostinger.

### Backend (Node.js)
1. Host on AWS EC2, DigitalOcean Droplet, or Heroku.
2. Ensure the environment variables are configured in the platform's dashboard.
3. Use a process manager like `pm2` for continuous uptime: `pm2 start server.js`.
