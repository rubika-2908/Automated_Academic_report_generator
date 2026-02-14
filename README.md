# Academic Report Generator

A frontend-based web application to manage student academic records, view analytics, and generate marksheets.

## Features

- User Registration and Login (stored in browser `localStorage`)
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
- Browser `localStorage` (no backend required)

## Project Structure

```text
Academic_report/
├── index.html
├── register.html
├── dashboard.html
├── styles.css
├── dashboard.css
├── script.js
├── dashboard.js
├── logo.png
└── backend/   (optional, not required for frontend usage)
```
## How to Run (Frontend Only)

Open terminal in project folder.
Start a local server:
`py -m http.server 5500`

Open in browser:

`http://localhost:5500/register.html
http://localhost:5500/index.html`

Usage Flow
Register a new user.
Login with the same credentials.
Open dashboard and create records.
Use filters/views to analyze results.
Download/print marksheets as needed.

