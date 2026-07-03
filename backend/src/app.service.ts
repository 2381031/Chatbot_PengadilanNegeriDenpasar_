import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { Pool } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

function cleanText(value = '') {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[\u2018\u2019']/g, '')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ');
}

function normalizeFaq(item: any) {
  const id = item.id ?? item.id_serial ?? item.no ?? '';
  const question = item.question ?? item.question_text ?? item.pertanyaan ?? item.text_question ?? '';
  const answer = item.answer ?? item.answer_text ?? item.jawaban ?? item.text_answer ?? '';

  return {
    id: id === null || id === undefined ? '' : String(id).trim(),
    question: String(question || '').trim(),
    answer: String(answer || '').trim(),
  };
}

function sortFaqs(list: any[]) {
  return list.slice().sort((a, b) => {
    const aId = Number(a.id);
    const bId = Number(b.id);

    if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
      return aId - bId;
    }

    return String(a.id).localeCompare(String(b.id));
  });
}

@Injectable()
export class AppService {
  async getHealth() {
    try {
      const result = await pool.query('SELECT NOW() AS waktu_database');
      return {
        status: 'OK',
        message: 'Backend berjalan',
        database: 'connected',
        waktu_database: result.rows[0].waktu_database,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        status: 'ERROR',
        message: 'Backend berjalan, tetapi database belum terhubung',
        detail: (error as Error).message,
      });
    }
  }

  async getFaqs() {
    try {
      const result = await pool.query(`
        SELECT
          id,
          TRIM(question) AS question,
          TRIM(answer) AS answer
        FROM faqs
        ORDER BY id ASC
      `);

      const data = result.rows
        .map((item: any) => normalizeFaq(item))
        .filter((item: any) => item.question && item.answer);

      return {
        success: true,
        data: sortFaqs(data),
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: 'Gagal mengambil daftar pertanyaan.',
        detail: (error as Error).message,
      });
    }
  }

  async chat(q: string) {
    const question = String(q || '').trim();

    if (!question) {
      throw new BadRequestException({
        reply: 'Pertanyaan tidak boleh kosong.',
      });
    }

    try {
      const result = await pool.query(`
        SELECT
          id,
          TRIM(question) AS question,
          TRIM(answer) AS answer
        FROM faqs
        ORDER BY id ASC
      `);

      const faqs = result.rows.map(normalizeFaq);
      const qNorm = cleanText(question);

      let matched = faqs.find((row: any) => cleanText(row.question) === qNorm);

      if (!matched) {
        matched = faqs.find((row: any) => {
          const rowNorm = cleanText(row.question);
          return rowNorm.includes(qNorm) || qNorm.includes(rowNorm);
        });
      }

      if (!matched) {
        let best = null;
        let bestScore = 0;

        for (const row of faqs) {
          const pWords = cleanText(row.question).split(' ').filter(Boolean);
          if (!pWords.length) continue;

          const qWords = new Set(qNorm.split(' ').filter(Boolean));
          let matchCount = 0;
          for (const word of pWords) {
            if (qWords.has(word)) matchCount++;
          }

          const score = matchCount / pWords.length;
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
        return {
          reply: 'Maaf, jawaban untuk pertanyaan tersebut belum tersedia. Silakan pilih menu Lainnya untuk mengajukan pertanyaan kepada petugas.',
        };
      }

      return {
        reply: matched.answer,
        question: matched.question,
        id: matched.id,
      };
    } catch (error) {
      throw new InternalServerErrorException({
        reply: 'Maaf, server sedang mengalami gangguan.',
        detail: (error as Error).message,
      });
    }
  }

  async submitQuestion(question: string) {
    const value = String(question || '').trim();

    if (!value) {
      throw new BadRequestException({
        success: false,
        error: 'Pertanyaan tidak boleh kosong.',
      });
    }

    try {
      const result = await pool.query(
        `INSERT INTO pertanyaan_lainnya (question, status)
         VALUES ($1, 'menunggu jawaban')
         RETURNING id, question, answer, status, created_at, answered_at`,
        [value],
      );

      return {
        success: true,
        message: 'Pertanyaan berhasil disimpan.',
        data: result.rows[0],
      };
    } catch (error) {
      throw new InternalServerErrorException({
        success: false,
        error: 'Gagal menyimpan pertanyaan.',
        detail: (error as Error).message,
      });
    }
  }
}
