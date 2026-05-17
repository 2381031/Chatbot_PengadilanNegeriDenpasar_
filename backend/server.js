import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

console.log("DATABASE URL:");
console.log(process.env.DATABASE_URL);

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

app.get("/", (req, res) => {
  res.send("Server chatbot berjalan");
});

app.get("/api/chat", async (req, res) => {
  try {

    const question = req.query.q?.toLowerCase();

    console.log("Question:", question);

    const result = await pool.query(
      "SELECT answer FROM faqs WHERE LOWER(question) = $1",
      [question]
    );

    console.log(result.rows);

    if (result.rows.length > 0) {
      res.json({
        reply: result.rows[0].answer,
      });
    } else {
      res.json({
        reply: "Pertanyaan tidak ditemukan",
      });
    }

  } catch (error) {

    console.log("ERROR DATABASE:");
    console.log(error);

    res.status(500).json({
      reply: "Terjadi kesalahan server",
    });
  }
});

app.listen(3000, () => {
  console.log("Server berjalan di port 3000");
});