import { bindable, INode, ICustomElementViewModel } from 'aurelia';

export class PartialDateCustomElement implements ICustomElementViewModel {
    @bindable decade = '192';
    @bindable year = '8';
    @bindable month = '07';
    @bindable day = '17';
    @bindable date_str: string;

    constructor(@INode readonly element: HTMLElement) {
    }

    bind() {
        this.parse_date_str();
    }

    parse_date_str() {
        let date_str = this.date_str;
        if (!date_str) {
            date_str = "????-??-??"
        } else {
            date_str = date_str + "-??-??";
        }
        const lst = date_str.split('-');
        this.decade = lst[0].substring(0, 3);
        this.year = lst[0].substring(3,4);
        this.month = lst[1];
        this.day = lst[2];
    }

    update_date_str() {
        this.date_str = this.decade + this.year + "-" + this.month + "-" + this.day;
    }

    decadeChanged(newValue, oldValue) {
        if (this.decade.length == 3) {
            this.focus("year");
            this.update_date_str();
        }
    }

    yearChanged(newValue, oldValue) {
        this.update_date_str();
    }

    monthChanged(newValue, oldValue) {
        if (newValue.includes("?")) {
            this.month = "??";
        }
        if (this.month.length == 2) {
            this.focus("decade");
        this.update_date_str();
        }
    }

    dayChanged(newValue, oldValue) {
        if (newValue.includes("?")) {
            this.day = "??";
        }
        if (this.day.length == 2) {
            this.focus("month");
        this.update_date_str();
        }
    }

    date_strChanged(newValue, oldValue) {
        this.split_date_str();
    }

    split_date_str() {
        if (this.date_str) {
            const lst = this.date_str.split('-');
            this.decade = lst[0].substring(0, 3);
            this.year = lst[0].substring(3, 4);
            this.month = lst[1];
            this.day = lst[2];
        }
    }

    focus(fieldName) {
        const el = this.element.querySelector('#' + fieldName);
        const inputs = el.getElementsByTagName("INPUT");

        // @ts-ignore
        inputs[0].focus();
    }

    attached() {
        this.split_date_str();
    }

}
