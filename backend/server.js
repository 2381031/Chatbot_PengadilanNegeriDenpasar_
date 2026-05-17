import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import pkg from "pg";

dotenv.config();

const { Pool } = pkg;

const app = express();

app.use(cors());
app.use(express.json());

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
    const question = req.query.q?.toLowerCase().trim();

    if (!question) {
      return res.json({
        reply: "Pertanyaan tidak boleh kosong",
      });
    }

    const result = await pool.query(
      "SELECT answer FROM faqs WHERE LOWER(question) = $1",
      [question]
    );

    if (result.rows.length > 0) {
      return res.json({
        reply: result.rows[0].answer,
      });
    }

    return res.json({
      reply: "Pertanyaan tidak ditemukan",
    });

  } catch (error) {
    console.log("ERROR DATABASE:");
    console.log(error);

    return res.status(500).json({
      reply: "Terjadi kesalahan server",
    });
  }
});

export default app;