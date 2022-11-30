import { DI } from "aurelia";

const date_sep = ".";

export const IMyDate = DI.createInterface<IMyDate>('IMyDate', x => x.singleton(MyDate));
export type IMyDate = MyDate;

export class MyDate {
    _day;
    _month;
    _year;
    mdays = [31,28,31,30,31,30,31,31,30,31,30,31];

    constructor(date_str) {
        if (! date_str) date_str = '1';
        date_str = date_str.replace("/", date_sep);
        const parts = date_str.split(date_sep);
        const n = parts.length;
        switch(n) {
            case 1:
                this._year = parseInt(parts[0] || '0');
                this._month = 0;
                this._day = 0;
                break;
            case 2:
                this._year = parseInt(parts[1] || '0');
                this._month = parseInt(parts[0]);
                this._day = 0;
                break;
            case 3:
                this._year = parseInt(parts[2] || '0');
                this._month = parseInt(parts[1]);
                this._day = parseInt(parts[0]);
                break;
        }
    }

    month_days(month, year) {
        let md = this.mdays[month - 1];
        if (month == 2 && year % 4 == 0) md += 1;
        return md;
    }

    fix_date() {
        let md = this.month_days(this._month, this._year);
        while (this._day > md) {
            this._day = this._day - md;
            this._month += 1;
            if (this._month == 13) {
                this._year += 1;
                this._month = 1;
            }
            md = this.month_days(this._month, this._year);
        }
        while (this._month > 12) {
            this._month -= 12;
            this._year += 1;
        }
    }


    incr(n) {
        if (this._day) {
            this._day += n
        } else if (this._month > 0) {
            this._month += n;
        } else {
            this._year += n;
        }
        this.fix_date();
    }

    detail_level() {
        if (this._day) {
            return 'D'
        } else if (this._month) {
            return 'M'
        }
        return 'Y'
    }

    is_valid() {
        if (this._year < 1000 || this._year > 2200) return 'partial';
        const dl = this.detail_level();
        if (dl == 'Y') return 'valid';
        if (dl == 'M') {
            if (0 < this._month && this._month <= 12) return 'valid';
            return 'error';
        }
        if (dl == 'D') {
            const md = this.month_days(this._month, this._year)
            if (0 < this._day && this._day <= md) return 'valid';
            return 'error';
        }
    }

    toString() {
        let s = '';
        if (this._day) {
            let day = this._day
            if (day < 10) {
                day = '0' + day;
            }
            s += day + date_sep
        }
        if (this._month != 0) {
            let m = this._month;
            if (m < 10) {
                m = '0' + m;
            }
            s += m + date_sep
        }
        s += this._year;
        return s;
    }
}

export function format_date(date_str, span=1) {
    const date = new MyDate(date_str);
    let s = date.toString();
    if (s.length < 4) return "";
    if (span > 1) {
        date.incr(span - 1);
        s += '-' + date.toString();
    }
    return s;
}
