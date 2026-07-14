# Smart Guard Duty Management System - Cloudflare Migration

This project is a 100% serverless, free-tier Guard Duty Management Dashboard migrated to the Cloudflare stack.

- **Frontend**: HTML5, CSS3, and Modular ES6 Javascript (SPA architecture) hosted on **Cloudflare Pages**.
- **Backend API**: **Cloudflare Workers** router.
- **Database**: **Cloudflare D1** SQLite database.

---

## Folder Structure

```
/
├── index.html                   # Login authentication page
├── dashboard.html               # Main SPA dashboard layout
├── css/
│   ├── style.css                # Base color tokens, themes, global CSS
│   └── dashboard.css            # Sidebar, grids, tables, widgets
├── js/
│   ├── api.js                   # REST API client using fetch()
│   ├── config.js                # API endpoint base configuration
│   ├── scheduler.js             # Timetable replacement candidate suggestions
│   ├── ui.js                    # SPA view-pane toggling, drag-and-drop
│   ├── utils.js                 # Languages translation dictionary, phonetic Marathi
│   ├── charts.js                # Custom lightweight SVG donut, bar, line charts
│   ├── filters.js               # Client search and dropdown logic
│   └── export.js                # Print styling and Excel CSV exporter
├── worker/
│   ├── index.js                 # Worker main fetch event handler
│   ├── routes.js                # API endpoint path router
│   ├── database.js              # Parameterized SQL prepared statements for D1
│   ├── scheduler.js             # Backend shift allocation algorithm
│   └── helpers.js               # JSON formatting and CORS headers
├── migrations/
│   ├── 001_schema.sql           # Database schema tables
│   ├── 002_indexes.sql          # DB performance optimization indexes
│   └── seed.sql                 # Seed database with sample guards and locations
├── wrangler.toml                # Cloudflare wrangler binding variables
├── .github/workflows/deploy.yml # Auto deployment GitHub Action
└── README.md                    # Project manual & installation steps
```

---

## Local Setup & Development

### 1. Prerequisites
Install [Node.js](https://nodejs.org) (v18 or higher recommended).

### 2. Install Project Dependencies
Run the installation command to fetch wrangler:
```bash
npm install
```

### 3. Log in to Cloudflare wrangler
Authenticate your terminal with your Cloudflare account credentials:
```bash
npx wrangler login
```

### 4. Create Cloudflare D1 SQL Database
Run the command to spin up a new D1 database instance:
```bash
npx wrangler d1 create smart-guard-duty-db
```
This command output will show your **`database_id`**. Copy this ID and paste it in `wrangler.toml` in the `database_id` field:
```toml
database_id = "your-copied-database-id"
```

### 5. Apply SQL Database Migrations
Initialize the tables and seed default guards/locations by running the migrations locally and on production:
```bash
# Apply migrations locally
npx wrangler d1 migrations apply smart-guard-duty-db --local

# Apply migrations to live production D1 database
npx wrangler d1 migrations apply smart-guard-duty-db --remote
```

### 6. Run Worker API & Frontend Locally
Run the local wrangler development server:
```bash
# Start Workers API on localhost:8787
npx wrangler dev worker/index.js --port 8787

# Serve HTML/JS static files
npx wrangler pages dev .
```

---

## Cloudflare Deployment

### 1. Manual CLI Deployments
Deploy Workers and Pages directly via Wrangler:
```bash
# Deploy Backend API Workers
npx wrangler deploy worker/index.js --name smart-guard-duty-system-api

# Deploy Pages Frontend
npx wrangler pages deploy . --project-name=smart-guard-duty-system
```

### 2. Continuous Integration via GitHub
You can configure automatic build-and-deploys upon pushing to the `main` branch:
1. Put your repo on GitHub.
2. In your repository settings, go to **Settings > Secrets and variables > Actions** and create two Secrets:
   - `CLOUDFLARE_API_TOKEN`: Your Cloudflare API Token (with Edit Cloudflare Workers and Pages permission).
   - `CLOUDFLARE_ACCOUNT_ID`: Your Cloudflare Account ID.
3. Once pushed, GitHub Actions will build and deploy the Workers and Pages instantly.

---

## Database Schema Migrations

To perform updates or migrations to the SQL schema in the future:
1. Create a new SQL file under `/migrations` (e.g. `003_add_new_column.sql`).
2. Run wrangler to register and apply it:
   ```bash
   npx wrangler d1 migrations apply smart-guard-duty-db --remote
   ```
