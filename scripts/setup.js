// Creates .env.local from .env.example on first run (works on Windows, macOS, Linux).
const fs = require("fs");
if (!fs.existsSync(".env.local")) {
  fs.copyFileSync(".env.example", ".env.local");
  console.log("\nCreated .env.local. Open it and paste your Supabase URL and anon key, then restart. Guide: http://localhost:3000/setup\n");
}
