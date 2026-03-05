const express = require("express");
const cors = require("cors");
const path = require("path");
const { sql, config } = require("./config/db");

const app = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));

// ==============================
// DATABASE + SERVER START
// ==============================
const PORT = process.env.PORT || 5000;
let pool;

async function startServer() {
  try {
    pool = await sql.connect(config);
    console.log("✅ Connected to MSSQL Database");

    app.locals.pool = pool;

    // ==============================
    // API ROUTES
    // ==============================

    app.use("/api/auth", require("./modules/auth/auth.routes"));
    app.use("/api/users", require("./modules/users/user.routes"));
    app.use("/api/departments", require("./modules/departments/department.routes"));
    app.use("/api/admissions", require("./modules/admissions/admissions.routes"));
    app.use("/api/progress-notes", require("./modules/progress-notes/progress-notes.routes"));
    app.use("/api/course-in-ward", require("./modules/courseintheward/courseintheward.routes"));
    app.use("/api", require("./modules/userdepartmentaccess/userdepartmentaccess.routes"));
    app.use("/api/notetemplates", require("./modules/notetemplates/notetemplates.routes"));
    app.use("/api/facility", require("./modules/facilityinformation/facilityinformation.routes"));
    app.use("/api/custom-forms", require("./modules/custom-forms/custom-forms.routes"));

    // ==============================
    // 🔥 SERVE UPLOADS (IMPORTANT)
    // ==============================

    // This must be BEFORE React fallback
  app.use(
  "/uploads",
  express.static(path.join(__dirname, "../../uploads"))
);
   console.log(
  "📁 Serving uploads from:",
  path.join(__dirname, "../../uploads")
);

    // ==============================
    // SERVE REACT FRONTEND (BUILD)
    // ==============================

    const frontendPath = path.join(__dirname, "../../dist");

    app.use(express.static(frontendPath));

    // ==============================
    // 🔥 REACT ROUTER FALLBACK
    // ==============================
    // IMPORTANT: Exclude /api AND /uploads
    app.get(/^\/(?!api|uploads).*/, (req, res) => {
      res.sendFile(path.join(frontendPath, "index.html"));
    });

    // ==============================
    // START SERVER
    // ==============================

    app.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 One EHR running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ DB Connection Error:", err);
    process.exit(1);
  }
}

startServer();