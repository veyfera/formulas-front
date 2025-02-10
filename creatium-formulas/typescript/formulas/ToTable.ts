import { Typing } from "./internal";

export class ToTable {
    static perform(data: any) {
        if (Typing.isNull(data)) {
            return {
                columns: [],
                rows: [],
                total_count: 0,
            };
        } else if (Typing.isArray(data)) {
            if (data.length === 0) {
                return {
                    columns: [],
                    rows: [],
                    total_count: 0,
                };
            } else {
                let keys = null;

                const rows = data.map(rawRow => {
                    if (!Typing.isObject(rawRow)) {
                        throw new Error('toTable2 :: ' + Typing.getType(rawRow));
                    }

                    if (keys === null) {
                        keys = Object.keys(rawRow);
                    }

                    let row = {};
                    keys.forEach((key) => {
                        row[key] = rawRow[key] ?? null;
                    });
                    return row;
                });

                return {
                    columns: keys.map(key => ({ id: key, name: key, type: 'any' })),
                    rows: rows,
                    total_count: data.length,
                };
            }
        } else {
            throw new Error('toTable1 :: ' + Typing.getType(data));
        }
    }
}