import { Typing } from "./internal.js"

export class Convertation {
    static toBoolean(value: any) {
        if (Typing.isBoolean(value)) return value;
        else if (Typing.isNumber(value)) return !Typing.isZero(value);
        else if (Typing.isString(value)) return value !== '';
        else if (Typing.isObject(value)) return true;
        else if (Typing.isArray(value)) return true;
        else if (Typing.isDate(value)) return true;
        else return false; // null
    }

    static toNumber(value: any) {
        if (Typing.isString(value)) {
            if (value === '') throw new Error('convert4');
            else if (value.toLowerCase() === '+infinity' || value.toLowerCase() === 'infinity') {
                return Infinity;
            } else if (value.toLowerCase() === '+inf' || value.toLowerCase() === 'inf') {
                return Infinity;
            } else if (value.toLowerCase() === '-infinity' || value.toLowerCase() === '-inf') {
                return -Infinity;
            } else if (value.toLowerCase() === 'nan') {
                return NaN;
            } else {
                const match = value.match(/^[+-]?\d+\.?\d*(e[+-]?\d+)?$/i);
                if (match) {
                    const result = parseFloat(value);
                    if (Math.abs(result) > Typing.DOUBLE_RANGE) throw new Error('convert6');
                    else return result;
                }
                else throw new Error('convert5');
            }
        }
        else if (Typing.isBoolean(value)) return value ? 1 : 0;
        else if (Typing.isNumber(value)) return value;
        else if (Typing.isNull(value)) return 0;
        else if (Typing.isDate(value)) return value.getTime();
        else throw new Error('convert1 :: ' + Typing.getType(value) + ',number');
    }

    static toString(value: any) {
        if (Typing.isString(value)) return value;
        else if (Typing.isBoolean(value)) return value ? 'true' : 'false';
        else if (Typing.isNumber(value)) return value.toString();
        else if (Typing.isNull(value)) return '';
        else if (Typing.isDate(value)) {
            const year = value.getUTCFullYear();
            if (year > 9999 || year < 0) {
                throw new Error('convert2 :: ' + year);
            }

            return value.toISOString();
        }
        else throw new Error('convert1 :: ' + Typing.getType(value) + ',string');
    }

    static toDate(value: any) {
        if (Typing.isDate(value)) {
            return value;
        } else if (Typing.isNumber(value)) {
            if (Typing.isNaN(value)) {
                throw new Error("convert7");
            }

            if (Math.abs(value) > Typing.TIMESTAMP_RANGE) {
                throw new Error("toDate1");
            }

            return new Date(value);
        } else if (Typing.isNull(value)) {
            return null;
        } else if (Typing.isString(value)) {
            if (value.match(Typing.ISO8601_PATTERN)) {
                // Приводим дату к формату ISO8601, иначе проблемы с браузерной совместимостью могут быть
                const parts = { date: null, time: null, zone: null };

                // Если даты нет, мы искусственно добавляем первое число
                const matchDate = value.match(/^\d\d\d\d-\d\d(-\d\d)?/);
                parts.date = matchDate[1] ? matchDate[0] : matchDate[0] + '-01';

                const matchTime = value.match(/([Tt ])(\d\d:\d\d)(:\d\d(\.\d+)?)?/);
                if (matchTime) {
                    // Если секунд нет, мы искусственно добавляем 00
                    parts.time = matchTime[3] ? matchTime[2] + matchTime[3] : matchTime[2] + ':00';
                } else {
                    parts.time = '00:00:00';
                }

                // Отсекаем дату, чтобы не путать день с часовым поясом
                const valueWithoutDate = value.match(/^\d\d\d\d-\d\d(-\d\d)?(.*)/)[2];

                const matchTimeZone = valueWithoutDate.match(/([Zz]|[+-]\d\d(:?\d\d)?)$/);

                if (matchTimeZone) {
                    if (matchTimeZone[0][0].toLowerCase() === 'z') {
                        parts.zone = 'Z';
                    } else {
                        parts.zone = matchTimeZone[2] ? matchTimeZone[1] : matchTimeZone[1] + ':00';
                    }
                } else {
                    parts.zone = 'Z';
                }

                const date = new Date(`${parts.date}T${parts.time}${parts.zone}`);

                // Так мы определяем ошибку в формировании даты
                if (Number.isNaN(date.getDay())) throw new Error('toDate1');

                const fulldate = value.match(/^\d\d\d\d-\d\d-\d\d/);
                if (fulldate) {
                    const parts = fulldate[0].split('-'), year = parts[0] * 1, month = parts[1] * 1 - 1, date = parts[2] * 1;
                    const utcDate = new Date(Date.UTC(year, month, date));
                    if (utcDate.getUTCFullYear() !== year || utcDate.getUTCMonth() !== month || utcDate.getUTCDate() !== date) {
                        // Автоматические смещения (с 2000-02-30 на 2000-03-02) не поддерживаем
                        throw new Error('toDate1');
                    }
                }

                return date;
            } else {
                throw new Error('toDate1');
            }
        } else throw new Error('convert1 :: ' + Typing.getType(value) + ',date');
    }
}