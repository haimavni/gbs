import { bindable, inject, DOM, computedFrom } from 'aurelia-framework';

@inject(DOM.Element)
export class PartialDateCustomElement {
    @bindable century = '19';
    @bindable decade = '2';
    @bindable year = '8';
    @bindable month = '07';
    @bindable day = '17';
    @bindable date_str: string;
    element;
    centuries = ["18", "19", "20"]; //for debugging. remove soon.
    decades = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    years = ["?", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    months = ["??", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    days = ["??", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "34", "25", "26", "27", "28", "29", "30", "31"];

    constructor(element, user, dialog) {
        this.element = element;
    }

    bind() {
        console.log("in bind partial date, date str: ", this.date_str);
        this.parse_date_str();
    }

    parse_date_str() {
        let date_str = this.date_str;
        if (!date_str) {
            date_str = "????-??-??"
        } else {
            date_str = date_str + "-??-??";
        }
        let lst = date_str.split('-');
        this.century = lst[0].substring(0, 3);
        this.decade = lst[0].substring(3, 4);
        this.month = lst[1];
        this.day = lst[2];
    }

    //@computedFrom('century', 'decade', 'year', 'month', 'day')
    update_date_str() {
        this.date_str = this.century + this.decade + this.year + "-" + this.month + "-" + this.day;
    }

    centuryChanged(newValue, oldValue) {
        if (newValue.includes("?")) {
            this.date_str = "????-??-??";
            return;
        }
        if (this.century.length == 2) {
            this.focus("decade");
        }
        this.update_date_str();
    }

    decadeChanged(newValue, oldValue) {
        if (this.decade.length == 1) {
            this.focus("year");
        }
        this.update_date_str();
    }

    yearChanged(newValue, oldValue) {
        this.update_date_str();
    }

    monthChanged(newValue, oldValue) {
        if (newValue.includes("?")) {
            this.month = "??";
        }
        if (this.month.length == 2) {
            this.focus("century");
        }
        this.update_date_str();
    }

    dayChanged(newValue, oldValue) {
        if (newValue.includes("?")) {
            this.day = "??";
        }
        if (this.day.length == 2) {
            this.focus("month");
        }
        this.update_date_str();
    }

    date_strChanged(newValue, oldValue) {
        this.split_date_str();
    }

    split_date_str() {
        if (this.date_str) {
            let lst = this.date_str.split('-');
            this.century = lst[0].substring(0, 2);
            this.decade = lst[0].substring(2, 3);
            this.year = lst[0].substring(3, 4);
            this.month = lst[1];
            this.day = lst[2];
        }
    }

    focus(fieldName) {
        let el = this.element.querySelector('#' + fieldName);
        let inputs = el.getElementsByTagName("INPUT");
        console.log("inputs: ", inputs);
        inputs[0].focus();
    }

    attached() {
        console.log("in attached partial date, date str: ", this.date_str);
        this.split_date_str();
    }

}
