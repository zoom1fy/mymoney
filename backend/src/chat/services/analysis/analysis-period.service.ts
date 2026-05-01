import { Injectable } from '@nestjs/common';
import { AnalysisPeriod, AnalysisPeriodSource } from '../../interfaces/analysis.interface';

@Injectable()
export class AnalysisPeriodService {
  extract(message: string): AnalysisPeriod {
    const m = message.toLowerCase().replace(/\s+/g, ' ').trim();

    // Если сообщение пустое, возвращаем текущий месяц
    if (!m) {
      const now = new Date();
      const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.FALLBACK_CURRENT_MONTH };
    }

    const now = new Date();
    let start: Date;
    let end: Date;

    // === 1) ПРОШЛЫЙ МЕСЯЦ (ПЕРВЫЙ ПРИОРИТЕТ) ===
    if (m.includes('прошлый месяц') || m.includes('за прошлый месяц')) {
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      start = new Date(currentYear, currentMonth - 1, 1, 0, 0, 0, 0);
      end = new Date(currentYear, currentMonth, 0, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.PREVIOUS_MONTH };
    }

    // === 2) ЭТОТ МЕСЯЦ ===
    if (m.includes('этот месяц') || m.includes('текущий месяц')) {
      start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.CURRENT_MONTH };
    }

    // === 3) ДИАПАЗОН ДАТ: "с 1 марта по 17 апреля" ===
    const rangeMatch = m.match(/с\s+(\d{1,2})\s+([а-я]+)\s+по\s+(\d{1,2})\s+([а-я]+)/);
    if (rangeMatch) {
      const [, d1, mon1, d2, mon2] = rangeMatch;
      const mm1 = this.mapMonth(mon1);
      const mm2 = this.mapMonth(mon2);
      if (mm1 !== null && mm2 !== null) {
        const year = now.getFullYear();
        start = new Date(year, mm1, Number(d1), 0, 0, 0, 0);
        end = new Date(year, mm2, Number(d2), 23, 59, 59, 999);
        return { start, end, source: AnalysisPeriodSource.RANGE };
      }
    }

    // === 4) ПОСЛЕДНИЕ X ДНЕЙ ===
    const lastXDaysMatch = m.match(/последн(ие|их)\s+(\d+)\s+дн[ейя]/i);
    if (lastXDaysMatch) {
      const days = Number(lastXDaysMatch[2]);
      const startDate = new Date(now);
      startDate.setDate(startDate.getDate() - days);
      startDate.setHours(0, 0, 0, 0);
      end = new Date(now);
      end.setHours(23, 59, 59, 999);
      return { start: startDate, end, source: AnalysisPeriodSource.LAST_X_DAYS };
    }

    // === 5) ПОСЛЕДНИЕ X МЕСЯЦЕВ (ИСПРАВЛЕНО) ===
    const lastXMonthsMatch = m.match(/последн(ие|их)\s+(\d+)\s+месяц[аев]/i);
    if (lastXMonthsMatch) {
      const months = Number(lastXMonthsMatch[2]);
      const totalMonths = now.getMonth() - months;
      const startYear = now.getFullYear() + Math.floor(totalMonths / 12);
      const adjustedMonth = ((totalMonths % 12) + 12) % 12; // ✅ Исправлено
      start = new Date(startYear, adjustedMonth, 1, 0, 0, 0, 0);
      end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.LAST_X_MONTHS };
    }

    // === 6) ПРОШЛЫЙ ГОД ===
    if (m.includes('прошлый год')) {
      const year = now.getFullYear() - 1;
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.PREVIOUS_YEAR };
    }

    // === 7) КОНКРЕТНЫЙ ГОД ===
    const yearOnlyMatch = m.match(/\b(19|20)\d{2}\b/);
    if (
      yearOnlyMatch &&
      !m.includes('месяц') &&
      !m.includes('январ') &&
      !m.includes('феврал') &&
      !m.includes('март') &&
      !m.includes('апрел') &&
      !m.includes('ма') &&
      !m.includes('июн') &&
      !m.includes('июл')
    ) {
      const year = Number(yearOnlyMatch[0]);
      start = new Date(year, 0, 1, 0, 0, 0, 0);
      end = new Date(year, 11, 31, 23, 59, 59, 999);
      return { start, end, source: AnalysisPeriodSource.SPECIFIC_YEAR };
    }

    // === 8) КОНКРЕТНЫЙ МЕСЯЦ ===
    const monthsMap: Record<string, number> = {
      январ: 0,
      феврал: 1,
      март: 2,
      апрел: 3,
      ма: 4,
      июн: 5,
      июл: 6,
      август: 7,
      сентябр: 8,
      октябр: 9,
      ноябр: 10,
      декабр: 11,
    };
    for (const [key, monthIndex] of Object.entries(monthsMap)) {
      if (m.includes(key)) {
        const yearMatch = m.match(/\b(19|20)\d{2}\b/);
        const year = yearMatch ? Number(yearMatch[0]) : now.getFullYear();
        start = new Date(year, monthIndex, 1, 0, 0, 0, 0);
        end = new Date(year, monthIndex + 1, 0, 23, 59, 59, 999);
        return { start, end, source: AnalysisPeriodSource.SPECIFIC_MONTH };
      }
    }

    // === 9) FALLBACK: текущий месяц ===
    start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0, 0);
    end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { start, end, source: AnalysisPeriodSource.FALLBACK_CURRENT_MONTH };
  }

  private mapMonth(txt: string): number | null {
    const t = txt.toLowerCase();
    const pairs: Array<[string, number]> = [
      ['январ', 0],
      ['феврал', 1],
      ['март', 2],
      ['апрел', 3],
      ['ма', 4],
      ['июн', 5],
      ['июл', 6],
      ['август', 7],
      ['сентябр', 8],
      ['октябр', 9],
      ['ноябр', 10],
      ['декабр', 11],
    ];
    for (const [key, idx] of pairs) {
      if (t.includes(key)) return idx;
    }
    return null;
  }
}
