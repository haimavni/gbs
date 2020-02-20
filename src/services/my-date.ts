const date_sep = ".";

export class MyDate {
    _day;
    _month;
    _year;

    constructor(date_str) {
        if (! date_str) date_str = '1';
        date_str = date_str.replace("/", date_sep);
        let parts = date_str.split(date_sep);
        let n = parts.length;
        switch(n) {
            case 1:
                this._year = parseInt(parts[0] || '0');
                break;
            case 2:
                this._year = parseInt(parts[1] || '0');
                this._month = parseInt(parts[0]) - 1
                break;
            case 3:
                this._year = parseInt(parts[2] || '0');
                this._month = parseInt(parts[1]) - 1;
                this._day = parseInt(parts[0]);
                break;
        }
    }

    incr(n) {
        if (this._day) {
            this._day += n
            this.validate();
        } else if (this._month != undefined) {
            this._month += n;
            this.validate();
        } else {
            this._year += n;
        }
    }

    detail_level() {
        if (this._day) {
            return 'D'
        } else if (this._month != undefined) {
            return 'M'
        }
        return 'Y'
    }

    validate() {
        if (this._year < 1000) return;
        let d = new Date(this._year, this._month || 1, this._day || 1);
        this._year = d.getFullYear();
        if (this._month != undefined) this._month = d.getMonth();
        if (this._day) this._day = d.getDate();
    }

    is_valid() {
        this.validate();
        let mon = this._month || 1;
        let day = this._day || 1;
        if (this._year < 1000) {
            return false;
        }
        return true;
        /*let d = new Date(this._year, mon - 1, day);
        return d && (d.getMonth() + 1) == this._month;*/
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
        if (this._month != undefined) { //months are 0-based...
            let m = this._month + 1;
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
    let date = new MyDate(date_str);
    let s = date.toString();
    if (s.length < 4) return "";
    if (span > 1) {
        date.incr(span - 1);
        s += '-' + date.toString();
    }
    return s;
}
