const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

app.get('/api/chat', async (req, res) => {
  const q = (req.query.q || '').trim();

  if (!q) {
    return res.status(400).json({
      reply: 'Pertanyaan tidak boleh kosong.'
    });
  }

  try {
    const result = await pool.query(
      `SELECT question, answer
       FROM fags
       WHERE LOWER(question) = LOWER($1)
          OR LOWER(question) LIKE LOWER($2)
          OR LOWER($1) LIKE '%' || LOWER(question) || '%'
       ORDER BY
          CASE WHEN LOWER(question) = LOWER($1) THEN 1 ELSE 2 END,
          id ASC
       LIMIT 1`,
      [q, `%${q}%`]
    );

    if (result.rows.length === 0) {
      return res.json({
        reply: 'Maaf, jawaban untuk pertanyaan tersebut belum tersedia. Silakan pilih menu Lainnya untuk mengajukan pertanyaan kepada petugas.'
      });
    }

    return res.json({
      reply: result.rows[0].answer
    });
  } catch (error) {
    console.error('Error /api/chat:', error);

    return res.status(500).json({
      reply: 'Maaf, server sedang mengalami gangguan.'
    });
  }
});

app.post('/api/pertanyaan-lainnya', async (req, res) => {
  const question = (req.body.question || '').trim();

  if (!question) {
    return res.status(400).json({
      error: 'Pertanyaan tidak boleh kosong.'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pertanyaan_lainnya (question, status)
       VALUES ($1, 'menunggu jawaban')
       RETURNING id, question, status, created_at`,
      [question]
    );

    return res.status(201).json({
      success: true,
      data: result.rows[0]
    });
  } catch (error) {
    console.error('Error /api/pertanyaan-lainnya:', error);

    return res.status(500).json({
      error: 'Gagal menyimpan pertanyaan.'
    });
  }
});

app.get('/api/pertanyaan-lainnya', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, question, answer, status, created_at, answered_at
       FROM pertanyaan_lainnya
       ORDER BY created_at DESC`
    );

    return res.json(result.rows);
  } catch (error) {
    console.error('Error get pertanyaan:', error);

    return res.status(500).json({
      error: 'Gagal mengambil data.'
    });
  }
});

app.get('/api/health', (req, res) => {
  res.json({
    status: 'OK'
  });
});

app.listen(port, () => {
  console.log(`Server berjalan di port ${port}`);
});