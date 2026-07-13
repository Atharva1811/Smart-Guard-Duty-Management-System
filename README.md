# Smart Guard Duty Management System

A premium, modern responsive web application for managing daily security guard duty rosters. This application runs entirely serverless, allowing 100% free hosting on **GitHub Pages** with support for two cloud database options: **Google Sheets (via Google Apps Script API)** or **GitHub Repository Storage (JSON database)**.

---

## 🚀 Features

- **Smart Allocation Engine**: Automatically generates daily rosters respecting shift/location preferences, resting hour rules, rotation indices, and consecutive night shift constraints.
- **Drag-and-Drop Editor**: Rearrange rosters manually. Supports cells locking (persists edits during auto-regeneration) and complete Undo/Redo tracking.
- **Conflict Warning Detector**: Real-time alerts for workload limits, double bookings, rest period overlaps, and weekly off violations.
- **KPI Dashboards**: Operations tracking using Recharts widgets detailing daily statuses, weekly workloads, location schedules, and vacancies.
- **A4 Printable Reports**: Optimised print layouts for rosters alongside export options to CSV/Excel formats.
- **Glassmorphic Theme**: Elegant dark and light dashboards styled with Tailwind CSS.

---

## 🛠️ Tech Stack

- **Frontend**: React (v19) + Vite, TypeScript, Tailwind CSS, Framer Motion (Transitions), Recharts (KPI Charts), Axios.
- **Storage Options**:
  - **Local**: Browser `localStorage` (Immediate offline operation, loaded with demo datasets).
  - **Google Sheets**: Free cloud storage via Google Apps Script.
  - **GitHub Repo JSON**: Free cloud storage via GitHub REST API + Personal Access Token.

---

## 📦 Installation & Setup

1. **Clone and Install**:
   ```bash
   npm install
   ```

2. **Run in Development**:
   ```bash
   npm run dev
   ```

3. **Production Compilation**:
   ```bash
   npm run build
   ```

4. **Verify Locally**:
   ```bash
   npm run preview
   ```

---

## 📊 Google Sheets Database Configuration

To use Google Sheets as your primary database:

1. Create a new **Google Spreadsheet**.
2. Go to **Extensions > Apps Script**.
3. Copy the content of the `google-apps-script/code.gs` file into the editor.
4. Click **Deploy > New Deployment**.
5. Select type **Web App**.
6. Set:
   - *Execute as*: **Me**
   - *Who has access*: **Anyone** (required to bypass CORS/Auth redirection triggers).
7. Copy the **Web App URL** provided after deployment.
8. Paste the Web App URL and Spreadsheet ID into the **Settings** panel of the application, and toggle **Enable Google Sheets Sync**.

---

## 🐙 GitHub Repository Storage Configuration

To store data directly in GitHub as a file (perfect for multi-PC access without Google Drive):

1. Create a **Private or Public Repository** on GitHub (e.g. `guard-duty-data`).
2. Generate a **GitHub Personal Access Token (PAT)** with `repo` write scopes.
3. In the application **Settings** panel:
   - Enter **Repository Owner** (your GitHub username).
   - Enter **Repo Name** (the repository name).
   - Paste your **Personal Access Token**.
   - Set **FilePath** (e.g., `guard_duty_db.json`).
   - Toggle **Enable GitHub Database**.

---

## 👤 Credentials (Quick Demo)

- **Admin**: Username: `admin` | Password: `admin123` (Full Access)
- **Supervisor**: Username: `supervisor` | Password: `supervisor123` (Edit & Generate Access)
- **Viewer**: Username: `viewer` | Password: `viewer123` (Read-only Access)
