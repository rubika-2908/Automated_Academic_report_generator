# Academic Report Generator

A web application to manage student academic records, authenticate users, view analytics, and generate marksheets.

## Features

- User registration and login with backend authentication
- Create and manage student records:
  - Student Name
  - Class
  - Subject
  - Term
  - Marks
- View reports in multiple formats:
  - Class-wise records
  - Subject-wise records
  - Average by class
  - Subject average per class
  - Specific class + subject average
  - Student report by term
  - Term comparison chart
- Download student marksheet (HTML)
- Print/Download PDF-style marksheet

## Tech Stack

- HTML5
- CSS3
- JavaScript (Vanilla)
- Node.js
- Express.js
- MongoDB

## Project Structure

```text
Academic_report/
├── index.html
├── register.html
├── dashboard.html
├── config.js
├── vercel.json
├── styles.css
├── dashboard.css
├── script.js
├── dashboard.js
├── logo.png
├── backend/
│   ├── railway.json
│   └── .env.example
└── frontend/   (optional React/Vite frontend)
```

## Local Run

1. Start the backend from `backend/`:
```bash
npm install
npm start
```

2. Start the static frontend from the project root:
```bash
py -m http.server 5500
```

3. Open:
```text
http://localhost:5500/index.html
http://localhost:5500/register.html
```

## Deployment

### Frontend on Vercel

- Deploy the project root as a static site.
- After Railway gives you a backend URL, update [config.js](C:/Users/Rubika/OneDrive/Desktop/Academic_report/config.js) and replace:
```js
const DEPLOYED_API_BASE_URL = "https://your-railway-app.up.railway.app/api";
```
- Vercel will use [vercel.json](C:/Users/Rubika/OneDrive/Desktop/Academic_report/vercel.json) automatically.

### Backend on Railway

- Deploy the `backend/` folder as the service root.
- Railway will use [backend/railway.json](C:/Users/Rubika/OneDrive/Desktop/Academic_report/backend/railway.json).
- Set these variables in Railway:
```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_strong_secret
FRONTEND_URL=https://your-frontend.vercel.app
ALLOWED_ORIGINS=https://your-frontend.vercel.app
```

### Optional React/Vite frontend

- If you deploy `frontend/` instead of the root static pages, create `frontend/.env` from [frontend/.env.example](C:/Users/Rubika/OneDrive/Desktop/Academic_report/frontend/.env.example).

