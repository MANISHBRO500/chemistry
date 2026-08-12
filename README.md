# BondBoard - Interactive Organic Chemistry & 3D Molecular Studio

BondBoard is a full-stack, responsive web application for drawing, analyzing, and visualizing 2D chemical structures and 3D molecular geometries, powered by Google Gemini AI and PubChem PUG REST API.

---

## 🚀 Features
- **Interactive 2D Canvas**: Place atoms, single/double/triple bonds, and standard functional groups (Benzene, Cyclohexane, Carboxyl, etc.).
- **3D Molecular Studio**: Render real-time 3D CPK ball-and-stick geometries with orbital rotation and space-filling models.
- **Auto-Draw AI Engine**: Type chemical names (*e.g., Aspirin, Acetone, Caffeine*) to automatically generate coordinates.
- **Google AI Chemistry Tutor**: Built-in chemistry tutor powered by Gemini 3.6 Flash for IUPAC nomenclature, reaction mechanisms, and valency analysis.

---

## 🛠️ Deployment on Render

### Step 1: Push Code to GitHub
1. Create a new repository on GitHub named `bond-board` (or `bondboard`).
2. Run the following commands in your project folder:
   ```bash
   git init
   git add .
   git commit -m "Initial commit - BondBoard web app"
   git branch -M main
   git remote add origin https://github.com/YOUR_GITHUB_USERNAME/bond-board.git
   git push -u origin main
   ```

### Step 2: Deploy to Render (https://render.com)
1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click **New +** ➔ **Web Service**.
3. Connect your GitHub repository `bond-board`.
4. Configure the Web Service settings:
   - **Name**: `bond-board`
   - **Language**: `Node`
   - **Branch**: `main`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm run start`
5. Under **Environment Variables**, add:
   - `GEMINI_API_KEY`: *(Your Google Gemini API Key from Google AI Studio)*
   - `NODE_ENV`: `production`
6. Click **Create Web Service**. Render will build and host your site live with free SSL!

---

## 💻 Local Development

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Set Environment Variable**:
   Create a `.env` file in the root folder:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   ```

3. **Start Development Server**:
   ```bash
   npm run dev
   ```
   Open `http://localhost:3000` in your browser.
