import { bindable, inject, bindingMode, computedFrom, DOM } from 'aurelia-framework';
import { User } from '../../services/user';
import { Theme } from '../../services/theme';
import { I18N } from 'aurelia-i18n';
import { MyDate } from '../../services/my-date';

const date_sep = ".";

@inject(User, Theme, DOM.Element, I18N)
export class DateRangeCustomElement {
    user;
    theme;
    i18n;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) base_date_str = "";
    @bindable({ defaultBindingMode: bindingMode.twoWay }) span_size = 1;
    @bindable label;
    @bindable range_options: any = [];
    @bindable hide_label_if_no_date = false;
    @bindable enable_days_range = false;
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
        if (! this.partial && ! this.enable_days_range) {
            return;
        }
        this.end_date_options = [];
        let i0 = 1;
        for (let i of arr) {
            if (i == 1) continue;
            let dif = date._year - cur_year;
            if (dif >= 0) {  //not future dates!
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
        date.incr(this.span_size - 1);
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
        if (this.span_size <= 1) return ""
        let date = new MyDate(this.base_date_str);
        date.incr(this.span_size - 1);
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

    @computedFrom("user.editing", "partial", "is_valid", "range_options", "base_date_str")
    get show_edit_end_date() {
        return this.base_date_str && this.is_valid && this.user.editing && (this.partial || this.enable_days_range) && this.range_options.length > 1;
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
        if (this.partial && this.span_size > 1) {
            s += '-';
            s += this.calc_end_date();
        }
        return s;
    }

    @computedFrom("user.editing", "base_date_str")
    get show_label() {
        return this.user.editing; // || this.base_date_str || ! this.hide_label_if_no_date; 
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
