import { bindable, autoinject, bindingMode, computedFrom } from 'aurelia-framework';
import { User } from '../../services/user';

function getDaysInMonth(month, year) {
    return new Date(year, month, 0).getDate();
}

export class MyDate {
    _day;
    _month;
    _year;

    constructor(date_str) {
        //replace "." by "/"
        let parts = date_str.split('/');
        let n = parts.length;
        switch(n) {
            case 1:
                this._year = parseInt(parts[0]);
                break;
            case 2:
                this._year = parseInt(parts[1]);
                this._month = parseInt(parts[0]) - 1
                break;
            case 3:
                this._year = parseInt(parts[2]);
                this._month = parseInt(parts[1]) - 1;
                this._day = parseInt(parts[0]);
                break;
        }
    }

    get day() {
        return this._day;
    }

    set day(d) {
        this._day = d;
    }

    get month() {
        return this._month + 1;
    }

    set month(m) {
        this._month = m - 1;
    }

    get year() {
        return this._year;
    }

    set year(y) {
        this._year = y;
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
        } else if (this._month) {
            return 'M'
        }
        return 'Y'
    }

    validate() {
        let d = new Date(this._year, this._month || 1, this._day || 1);
        this._year = d.getFullYear();
        if (this._month != undefined) this._month = d.getMonth();
        if (this._day) this._day = d.getDate();
    }

    is_valid() {
        let d = new Date(this._year, this._month - 1, this._day);
        return d && (d.getMonth() + 1) == this._month;
    }

    toString() {
        let s = '';
        if (this._day) {
            s += this._day + '/'
        }
        if (this._month != undefined) {
            s += (this._month+1) + '/'
        }
        s += this._year;
        return s;
    }
}

@autoinject
export class DateRangeCustomElement {
    user;
    @bindable base_date_str = "01/01/0001";
    @bindable({ defaultBindingMode: bindingMode.twoWay }) span_size = 5;
    end_date_str;
    end_date_options = [];
    partial;

    constructor(user: User) {
        this.user = user;
    }

    attached() {
        this.build_end_date_options();
    }

    build_end_date_options() {
        this.end_date_options = [];
        let parts = this.base_date_str.split('/');
        if (parts.length == 3) {
            this.partial = false;
            return;
        }
        this.partial = true;
        let date = new MyDate(this.base_date_str);
        for (let i=0; i < 10; i++) {
            date.incr(1);
            let option = {name: date.toString(), value: i};
            this.end_date_options.push(option)
        }
        date = new MyDate(this.base_date_str);
        date.incr(this.span_size);
        this.end_date_str = date.toString();
    }

    base_date_changed(event) {
        this.build_end_date_options();
    }

    on_keyup(event) {
        this.build_end_date_options();
        console.log("keyup ", this.base_date_str, " key ", event.key)
    }

    keep_only_good_chars(event) {
        let key = event.key;
        if (key == "Enter") {
            return true;
        }
        let m = key.match(/[0-9/]/);
        console.log("key ", key, " str ", this.base_date_str);
        return m != null;
    }

}