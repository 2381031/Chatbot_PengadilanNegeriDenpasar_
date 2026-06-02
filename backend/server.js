const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

app.get('/', (req, res) => {
  noCache(res);
  res.status(200).send('Backend chatbot PN Denpasar berjalan.');
});

app.get('/api/health', async (req, res) => {
  noCache(res);

  try {
    const result = await pool.query('SELECT NOW() AS waktu_database');

    res.status(200).json({
      status: 'OK',
      message: 'Backend Vercel berjalan',
      database: 'connected',
      waktu_database: result.rows[0].waktu_database
    });
  } catch (error) {
    res.status(500).json({
      status: 'ERROR',
      message: 'Backend berjalan, tetapi database belum terhubung',
      detail: error.message
    });
  }
});

app.get('/api/faqs', async (req, res) => {
  noCache(res);

  try {
    const result = await pool.query(`
      SELECT id, question, answer
      FROM faqs
      ORDER BY id ASC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil daftar pertanyaan.',
      detail: error.message
    });
  }
});

app.get('/api/chat', async (req, res) => {
  noCache(res);

  const q = (req.query.q || '').trim();

  if (!q) {
    return res.status(400).json({
      reply: 'Pertanyaan tidak boleh kosong.'
    });
  }

  try {
    const result = await pool.query(
      `SELECT question, answer
       FROM faqs
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
      return res.status(200).json({
        reply: 'Maaf, jawaban untuk pertanyaan tersebut belum tersedia. Silakan pilih menu Lainnya untuk mengajukan pertanyaan kepada petugas.'
      });
    }

    res.status(200).json({
      reply: result.rows[0].answer
    });
  } catch (error) {
    res.status(500).json({
      reply: 'Maaf, server sedang mengalami gangguan.',
      detail: error.message
    });
  }
});

app.post('/api/pertanyaan-lainnya', async (req, res) => {
  noCache(res);

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

    res.status(201).json({
      success: true,
      message: 'Pertanyaan berhasil disimpan.',
      data: result.rows[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Gagal menyimpan pertanyaan.',
      detail: error.message
    });
  }
});

app.get('/api/pertanyaan-lainnya', async (req, res) => {
  noCache(res);

  try {
    const result = await pool.query(`
      SELECT id, question, answer, status, created_at, answered_at
      FROM pertanyaan_lainnya
      ORDER BY created_at DESC
    `);

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Gagal mengambil data pertanyaan.',
      detail: error.message
    });
  }
});

module.exports = app;

if (require.main === module) {
  const port = process.env.PORT || 3000;
  app.listen(port, () => console.log(`Server lokal berjalan di port ${port}`));
}