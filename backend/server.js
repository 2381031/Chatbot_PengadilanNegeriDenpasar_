const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

app.get('/api/faqs', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, question
       FROM fags
       ORDER BY id ASC`
    );

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error /api/faqs:', error);

    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar pertanyaan.',
      detail: error.message
    });
  }
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
      success: false,
      error: 'Pertanyaan tidak boleh kosong.'
    });
  }

  try {
    const result = await pool.query(
      `INSERT INTO pertanyaan_lainnya (question, status)
       VALUES ($1, 'menunggu jawaban')
       RETURNING id, question, answer, status, created_at, answered_at`,
      [question]
    );

    return res.status(201).json({
      success: true,
      message: 'Pertanyaan berhasil disimpan.',
      data: result.rows[0]
    });

  } catch (error) {
    console.error('Error /api/pertanyaan-lainnya:', error);

    return res.status(500).json({
      success: false,
      error: 'Gagal menyimpan pertanyaan.',
      detail: error.message
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

    return res.json({
      success: true,
      data: result.rows
    });

  } catch (error) {
    console.error('Error get pertanyaan lainnya:', error);

    return res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pertanyaan.',
      detail: error.message
    });
  }
});

app.get('/api/health', async (req, res) => {
  try {
    await pool.query('SELECT NOW()');

    return res.json({
      status: 'OK',
      database: 'connected'
    });

  } catch (error) {
    return res.status(500).json({
      status: 'ERROR',
      database: 'not connected',
      detail: error.message
    });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;

  app.listen(port, () => {
    console.log(`Server berjalan di port ${port}`);
  });
}