import express from "express";
import mysql from "mysql2/promise";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));
app.use("/css", express.static(path.join(__dirname, "public/css")));
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));

const pool = mysql.createPool({
  host: process.env.DB_HOST || "localhost",
  user: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "",
  database: process.env.DB_NAME || "quotes_db",
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

// Home
app.get("/", (req, res) => res.render("index"));

// DB test
app.get("/dbTest", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.send("Database connected successfully!");
  } catch (e) {
    res.status(500).send("Database connection failed.");
  }
});

// ------------ Authors ------------
// Add author form
app.get("/author/new", (req, res) => {
  res.render("authorForm", { formTitle: "Add Author", action: "/author/new", authorInfo: null, message: null });
});

// Add author action
app.post("/author/new", async (req, res) => {
  const { firstName, lastName, dob, sex } = req.body;
  await pool.query("INSERT INTO q_authors (firstName, lastName, dob, sex) VALUES (?, ?, ?, ?)",
                  [firstName, lastName, dob, sex]);
  res.render("authorForm", { formTitle: "Add Author", action: "/author/new", authorInfo: null, message: "Author added!" });
});

// List authors
app.get("/authors", async (req, res) => {
  const [authors] = await pool.query("SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') as dobISO FROM q_authors ORDER BY lastName");
  res.render("authorList", { authors });
});

// Edit author form
app.get("/author/edit", async (req, res) => {
  const authorId = req.query.authorId;
  const [rows] = await pool.query("SELECT *, DATE_FORMAT(dob, '%Y-%m-%d') as dobISO FROM q_authors WHERE authorId = ?", [authorId]);
  res.render("authorForm", { formTitle: "Edit Author", action: "/author/edit", authorInfo: rows[0], message: null });
});

// Edit author action
app.post("/author/edit", async (req, res) => {
  const { authorId, firstName, lastName, dob, sex } = req.body;
  await pool.query("UPDATE q_authors SET firstName=?, lastName=?, dob=?, sex=? WHERE authorId=?", [firstName, lastName, dob, sex, authorId]);
  res.redirect("/authors");
});

// Delete author
app.get("/author/delete", async (req, res) => {
  await pool.query("DELETE FROM q_authors WHERE authorId = ?", [req.query.authorId]);
  res.redirect("/authors");
});

// ------------ Quotes ------------
// Add quote form
app.get("/quote/new", async (req, res) => {
  const [authors] = await pool.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
  res.render("quoteForm", { formTitle: "Add Quote", action: "/quote/new", quoteInfo: null, authors, message: null });
});

// Add quote action
app.post("/quote/new", async (req, res) => {
  const { quote, category, authorId } = req.body;
  await pool.query("INSERT INTO q_quotes (quote, category, authorId) VALUES (?, ?, ?)", [quote, category, authorId]);
  const [authors] = await pool.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
  res.render("quoteForm", { formTitle: "Add Quote", action: "/quote/new", quoteInfo: null, authors, message: "Quote added!" });
});

// List quotes
app.get("/quotes", async (req, res) => {
  const [quotes] = await pool.query(`
    SELECT q.quoteId, q.quote, q.category, q.authorId, a.firstName, a.lastName
      FROM q_quotes q
      JOIN q_authors a ON q.authorId = a.authorId
      ORDER BY a.lastName
  `);
  res.render("quoteList", { quotes });
});

// Edit quote form
app.get("/quote/edit", async (req, res) => {
  const quoteId = req.query.quoteId;
  const [quoteRows] = await pool.query("SELECT * FROM q_quotes WHERE quoteId = ?", [quoteId]);
  const quoteInfo = quoteRows[0];
  const [authors] = await pool.query("SELECT authorId, firstName, lastName FROM q_authors ORDER BY lastName");
  res.render("quoteForm", { formTitle: "Edit Quote", action: "/quote/edit", quoteInfo, authors, message: null });
});

// Edit quote action
app.post("/quote/edit", async (req, res) => {
  const { quoteId, quote, category, authorId } = req.body;
  await pool.query("UPDATE q_quotes SET quote=?, category=?, authorId=? WHERE quoteId=?", [quote, category, authorId, quoteId]);
  res.redirect("/quotes");
});

// Delete quote
app.get("/quote/delete", async (req, res) => {
  await pool.query("DELETE FROM q_quotes WHERE quoteId = ?", [req.query.quoteId]);
  res.redirect("/quotes");
});

// Start server
const port = process.env.PORT || 3000;
app.listen(port, () => console.log(`Server running at http://localhost:${port}`));
