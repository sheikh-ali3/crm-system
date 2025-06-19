# Deploying MOAQA MERN Project on cPanel

## 1. Build the React Frontend

1. Open a terminal and navigate to the `frontend` directory:
   ```bash
   cd frontend
   npm install
   npm run build
   ```
2. This creates a `build/` folder inside `frontend/` with production-ready static files.

## 2. Prepare the Backend

1. Make sure your backend `package.json` has this script:
   ```json
   "scripts": {
     "start": "node server.js"
   }
   ```
2. Ensure your backend uses environment variables for sensitive data (see `.env.example`).
3. The backend is already set up to serve the React build from `frontend/build`.

## 3. MongoDB Setup

- Use a cloud MongoDB provider (e.g., MongoDB Atlas) or ensure your cPanel host supports MongoDB.
- Set your production MongoDB URI in a `.env` file:
  ```env
  MONGO_URI=your_mongodb_connection_string
  JWT_SECRET=your_jwt_secret
  PORT=5000
  ```

## 4. Upload to cPanel

1. Zip your **backend** folder (including the `frontend/build` directory inside it).
2. Upload the zip to your cPanel Node.js app directory and extract it.
3. In cPanel, open the Terminal or use File Manager to run:
   ```bash
   npm install
   ```
4. Place your `.env` file in the backend root (do **not** upload `.env` to public repos).

## 5. Configure the Node.js App in cPanel

1. In cPanel, go to **Setup Node.js App**.
2. Set the app root to your backend directory.
3. Set the startup file to `server.js`.
4. Set environment variables (or use your `.env` file).
5. Start the app from cPanel.

## 6. Access Your App

- Your app will be available at the domain/subdomain you configured in cPanel.
- All API routes and the React frontend will be served from the same URL.

## 7. Troubleshooting

- Check the cPanel error logs if the app does not start.
- Make sure MongoDB is accessible from your cPanel server.
- Ensure all environment variables are set correctly.

---

**No mock DB or dev/test scripts are included. All functionality is production-ready.**

If you need to customize the port or other settings, update your `.env` file accordingly. 