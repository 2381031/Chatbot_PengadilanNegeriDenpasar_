const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
require('dotenv').config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production'
    ? { rejectUnauthorized: false }
    : false
});

function isDatabaseConfigured() {
  return Boolean(process.env.DATABASE_URL);
}

function noCache(res) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  res.setHeader('Surrogate-Control', 'no-store');
}

function cleanText(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

async function getFaqs() {
  const result = await pool.query(`
    SELECT
      id,
      TRIM(question) AS question,
      TRIM(answer) AS answer
    FROM faqs
    ORDER BY id ASC
  `);

  return result.rows;
}

function scoreMatch(query, question) {
  const qWords = new Set(cleanText(query).split(' ').filter(Boolean));
  const pWords = cleanText(question).split(' ').filter(Boolean);

  if (pWords.length === 0) return 0;

  let matchCount = 0;
  for (const word of pWords) {
    if (qWords.has(word)) matchCount++;
  }

  return matchCount / pWords.length;
}

app.get('/', (req, res) => {
  noCache(res);
  res.status(200).send('Backend chatbot PN Denpasar berjalan.');
});

app.get('/api/health', async (req, res) => {
  noCache(res);

  if (!isDatabaseConfigured()) {
    return res.status(500).json({
      status: 'ERROR',
      message: 'DATABASE_URL belum disetel. Silakan atur variabel lingkungan DATABASE_URL di Vercel.',
    });
  }

  try {
    const result = await pool.query('SELECT NOW() AS waktu_database');

    res.status(200).json({
      status: 'OK',
      message: 'Backend berjalan',
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

  if (!isDatabaseConfigured()) {
    return res.status(500).json({
      success: false,
      error: 'DATABASE_URL belum disetel. Silakan atur variabel lingkungan DATABASE_URL di Vercel.',
    });
  }

  try {
    const data = await getFaqs();

    res.status(200).json({
      success: true,
      data
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

  const q = String(req.query.q || '').trim();

  if (!q) {
    return res.status(400).json({
      reply: 'Pertanyaan tidak boleh kosong.'
    });
  }

  try {
    const faqs = await getFaqs();
    const qNorm = cleanText(q);

    let matched = faqs.find(row => cleanText(row.question) === qNorm);

    if (!matched) {
      matched = faqs.find(row => {
        const rowNorm = cleanText(row.question);
        return rowNorm.includes(qNorm) || qNorm.includes(rowNorm);
      });
    }

    if (!matched) {
      let best = null;
      let bestScore = 0;

      for (const row of faqs) {
        const score = scoreMatch(q, row.question);
        if (score > bestScore) {
          bestScore = score;
          best = row;
        }
      }

      if (best && bestScore >= 0.5) {
        matched = best;
      }
    }

    if (!matched) {
      return res.status(200).json({
        reply: 'Maaf, jawaban untuk pertanyaan tersebut belum tersedia. Silakan pilih menu Lainnya untuk mengajukan pertanyaan kepada petugas.'
      });
    }

    res.status(200).json({
      reply: matched.answer,
      question: matched.question,
      id: matched.id
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

  const question = String(req.body.question || '').trim();

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