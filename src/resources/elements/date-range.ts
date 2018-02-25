import { bindable, autoinject, bindingMode, computedFrom } from 'aurelia-framework';
import { User } from '../../services/user';
import { Theme } from '../../services/theme';

export class MyDate {
    _day;
    _month;
    _year;

    constructor(date_str) {
        let parts = date_str.split('/');
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
        let d = new Date(this._year, this._month || 1, this._day || 1);
        this._year = d.getFullYear();
        if (this._month != undefined) this._month = d.getMonth();
        if (this._day) this._day = d.getDate();
    }

    is_valid() {
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
            s += day + '/'
        }
        if (this._month != undefined) { //months are 0-based...
            let m = this._month + 1;
            if (m < 10) {
                m = '0' + m;
            }
            s += m + '/'
        }
        s += this._year;
        return s;
    }
}

@autoinject
export class DateRangeCustomElement {
    user;
    theme;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) base_date_str = "01/01/0001";
    @bindable({ defaultBindingMode: bindingMode.twoWay }) span_size = 5;
    @bindable label;
    end_date_str;
    end_date_options = [];
    partial;
    is_valid;

    constructor(user: User, theme: Theme) {
        this.user = user;
        this.theme = theme;
    }

    attached() {
        this.build_end_date_options();
    }

    build_end_date_options() {
        let date = new MyDate(this.base_date_str);
        this.is_valid = date.is_valid();
        if (!this.is_valid) {
            this.partial = true;
            return;
        }
        this.partial = date.detail_level() != 'D';
        if (! this.partial) {
            return;
        }
        this.end_date_options = [];
        for (let i=0; i < 10; i++) {
            let option = {name: date.toString(), value: i};
            this.end_date_options.push(option)
            date.incr(1);
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

    @computedFrom("user.editing", "partial", "is_valid")
    get show_edit_end_date() {
        return this.is_valid && this.user.editing && this.partial;
    }

    @computedFrom("user.editing", "partial", "is_valid")
    get dont_show_edit_end_date() {
        return ! (this.is_valid && this.user.editing && this.partial);
    }

    @computedFrom("user.editing", "partial", "span_size", "is_valid")
    get show_end_date() {
       return this.is_valid && this.partial && this.span_size > 0 && (! this.user.editing) 
    }
    
    @computedFrom("user.editing", "partial", "span_size", "is_valid")
    get show_labels() {
        return this.is_valid && this.partial && (this.user.editing || this.span_size > 0)
    }

    @computedFrom("user.editing")
    get show_date() {
        return this.base_date_str && ! this.user.editing;
    }

}