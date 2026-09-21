/**
 * authController.js — Authentication Controller
 */

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { dbRun, dbGet, dbAll } = require("../db");

const signToken = (user) =>
  jwt.sign(
    { id: user.id, name: user.name, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || "7d" }
  );

/** POST /api/auth/register */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password)
      return res.status(400).json({ success: false, message: "Name, email, and password are required." });

    if (password.length < 6)
      return res.status(400).json({ success: false, message: "Password must be at least 6 characters." });

    const existing = await dbGet("SELECT id FROM users WHERE email = ?", [email.toLowerCase()]);
    if (existing)
      return res.status(409).json({ success: false, message: "An account with this email already exists." });

    const hashedPassword = await bcrypt.hash(password, 10);

    // Assign role if provided, otherwise first registered user becomes admin
    const countRow = await dbGet("SELECT COUNT(*) as cnt FROM users", []);
    const role = req.body.role || (countRow.cnt === 0 ? "admin" : "member");

    const { lastID } = await dbRun(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email.toLowerCase(), hashedPassword, role]
    );

    const user = await dbGet("SELECT id, name, email, role, created_at FROM users WHERE id = ?", [lastID]);
    const token = signToken(user);

    res.status(201).json({ success: true, message: "User registered successfully.", token, user });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ success: false, message: "Server error during registration." });
  }
};

/** POST /api/auth/login */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password are required." });

    const user = await dbGet("SELECT * FROM users WHERE email = ?", [email.toLowerCase()]);
    if (!user)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(401).json({ success: false, message: "Invalid email or password." });

    const token = signToken(user);
    const { password: _pwd, ...safeUser } = user;

    res.status(200).json({ success: true, token, user: safeUser });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ success: false, message: "Server error during login." });
  }
};

/** GET /api/auth/me */
const getMe = async (req, res) => {
  try {
    const user = await dbGet(
      "SELECT id, name, email, role, created_at FROM users WHERE id = ?",
      [req.user.id]
    );
    if (!user) return res.status(404).json({ success: false, message: "User not found." });
    res.status(200).json({ success: true, user });
  } catch (err) {
    console.error("GetMe error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

/** GET /api/auth/users */
const getUsers = async (req, res) => {
  try {
    const users = await dbAll("SELECT id, name, email, role, created_at FROM users ORDER BY name", []);
    res.status(200).json({ success: true, data: users });
  } catch (err) {
    console.error("GetUsers error:", err);
    res.status(500).json({ success: false, message: "Server error." });
  }
};

module.exports = { register, login, getMe, getUsers };
