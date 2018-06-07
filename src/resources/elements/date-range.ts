import { bindable, inject, bindingMode, computedFrom, DOM } from 'aurelia-framework';
import { User } from '../../services/user';
import { Theme } from '../../services/theme';
import { I18N } from 'aurelia-i18n';

const date_sep = ".";

export class MyDate {
    _day;
    _month;
    _year;

    constructor(date_str) {
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

@inject(User, Theme, DOM.Element, I18N)
export class DateRangeCustomElement {
    user;
    theme;
    i18n;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) base_date_str = "";
    @bindable({ defaultBindingMode: bindingMode.twoWay }) span_size = 0;
    @bindable label;
    @bindable range_options: any = [];
    _end_date_str="";
    end_date_options = [];
    partial;
    is_valid = false;
    element;
    hint;

    constructor(user: User, theme: Theme, element, i18n) {
        this.user = user;
        this.theme = theme;
        this.element = element;
        this.i18n = i18n;
        this.hint = this.i18n.tr('date-hint')
    }

    attached() {
        this.build_end_date_options();
    }

    build_end_date_options() {
        if (! this.base_date_str) return;
        this.base_date_str = this.base_date_str.replace('/', date_sep);
        let arr;
        let today = new Date();
        let cur_year = today.getFullYear();
        if (typeof this.range_options === 'number') {
            let N = this.range_options;
            arr = Array.apply(null, {length: N}).map(Number.call, Number);
        } else if (typeof this.range_options == 'object') {
            arr = this.range_options
        } else {
            return;
        }
        if (this.base_date_str == undefined) {
            this.base_date_str = "";
        }
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
        let i0 = 0;
        for (let i of arr) {
            let dif = date._year - cur_year;
            if (dif >= 0) {
                i0 -= dif;
                date.incr(-dif);
            }
            let option = {name: date.toString(), value: i0};
            this.end_date_options.push(option);
            if (dif >= 0) break;
            date.incr(i - i0);
            i0 = i;
        }
        date = new MyDate(this.base_date_str);
        date.incr(this.span_size);
        this._end_date_str = date.toString();
    }

    base_date_changed(event) {
        event.stopPropagation();
        this.build_end_date_options();
        this.dispatch_event();
    }

    span_size_changed(event) {
        event.stopPropagation();
        this.build_end_date_options();
        this.dispatch_event();
    }

    calc_end_date() {
        let date = new MyDate(this.base_date_str);
        date.incr(this.span_size);
        this._end_date_str = date.toString();
        return this._end_date_str;
    }

    @computedFrom('base_date_str', 'span_size')
    get end_date_str() {
        let date = new MyDate(this.base_date_str);
        date.incr(this.span_size);
        this._end_date_str = date.toString();
        return this._end_date_str;
    }

    keep_only_good_chars(event) {
        let key = event.key;
        if (key == "Enter") {
            return true;
        }
        let m = key.match(/[0-9/]/) || key == 'Backspace' || key == 'Delete';
        return m != null;
    }

    @computedFrom("user.editing", "partial", "is_valid")
    get show_edit_end_date() {
        return this.base_date_str && this.is_valid && this.user.editing && this.partial && this.range_options.length > 1;
    }

    @computedFrom("user.editing", "partial", "is_valid")
    get dont_show_edit_end_date() {
        return ! (this.is_valid && this.user.editing && this.partial);
    }
    
    @computedFrom("user.editing","base_date_str", "span_size")
    get show_date() {
        if (this.user.editing) return false;
        this.build_end_date_options();
        let s = this.base_date_str;
        if (this.partial && this.span_size > 0) {
            s += '-';
            s += this.calc_end_date();
        }
        return s;
    }

    @computedFrom("user.editing", "base_date_str", "span_size")
    get show_label() {
        return this.base_date_str && this.user.editing;
    }

    @computedFrom("base_date_str", "user.editing")
    get build_now() {
        this.build_end_date_options();
        return true;
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                date_str: this.base_date_str,
                date_span: this.span_size,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }
}
