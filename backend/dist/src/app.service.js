"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppService = void 0;
const common_1 = require("@nestjs/common");
const pg_1 = require("pg");
const dotenv = __importStar(require("dotenv"));
dotenv.config();
const pool = new pg_1.Pool({
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
function normalizeFaq(item) {
    const id = item.id ?? item.id_serial ?? item.no ?? '';
    const question = item.question ?? item.question_text ?? item.pertanyaan ?? item.text_question ?? '';
    const answer = item.answer ?? item.answer_text ?? item.jawaban ?? item.text_answer ?? '';
    return {
        id: id === null || id === undefined ? '' : String(id).trim(),
        question: String(question || '').trim(),
        answer: String(answer || '').trim(),
    };
}
function sortFaqs(list) {
    return list.slice().sort((a, b) => {
        const aId = Number(a.id);
        const bId = Number(b.id);
        if (!Number.isNaN(aId) && !Number.isNaN(bId)) {
            return aId - bId;
        }
        return String(a.id).localeCompare(String(b.id));
    });
}
let AppService = class AppService {
    async getHealth() {
        try {
            const result = await pool.query('SELECT NOW() AS waktu_database');
            return {
                status: 'OK',
                message: 'Backend berjalan',
                database: 'connected',
                waktu_database: result.rows[0].waktu_database,
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                status: 'ERROR',
                message: 'Backend berjalan, tetapi database belum terhubung',
                detail: error.message,
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
                .map(normalizeFaq)
                .filter(item => item.question && item.answer);
            return {
                success: true,
                data: sortFaqs(data),
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                success: false,
                error: 'Gagal mengambil daftar pertanyaan.',
                detail: error.message,
            });
        }
    }
    async chat(q) {
        const question = String(q || '').trim();
        if (!question) {
            throw new common_1.BadRequestException({
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
                    const pWords = cleanText(row.question).split(' ').filter(Boolean);
                    if (!pWords.length)
                        continue;
                    const qWords = new Set(qNorm.split(' ').filter(Boolean));
                    let matchCount = 0;
                    for (const word of pWords) {
                        if (qWords.has(word))
                            matchCount++;
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
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                reply: 'Maaf, server sedang mengalami gangguan.',
                detail: error.message,
            });
        }
    }
    async submitQuestion(question) {
        const value = String(question || '').trim();
        if (!value) {
            throw new common_1.BadRequestException({
                success: false,
                error: 'Pertanyaan tidak boleh kosong.',
            });
        }
        try {
            const result = await pool.query(`INSERT INTO pertanyaan_lainnya (question, status)
         VALUES ($1, 'menunggu jawaban')
         RETURNING id, question, answer, status, created_at, answered_at`, [value]);
            return {
                success: true,
                message: 'Pertanyaan berhasil disimpan.',
                data: result.rows[0],
            };
        }
        catch (error) {
            throw new common_1.InternalServerErrorException({
                success: false,
                error: 'Gagal menyimpan pertanyaan.',
                detail: error.message,
            });
        }
    }
};
exports.AppService = AppService;
exports.AppService = AppService = __decorate([
    (0, common_1.Injectable)()
], AppService);
//# sourceMappingURL=app.service.js.map