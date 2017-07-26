import { bindable, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class PartialDateCustomElement {
    @bindable century = 19;
    @bindable decade = 3;
    @bindable year = 0;
    @bindable month;
    @bindable day;
    @bindable date_str;
    element;
    centuries = ["18", "19", "20"]; //for debugging. remove soon.
    decades = ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    years = ["?", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"];
    months = ["??", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12"];
    days = ["??", "01", "02", "03", "04", "05", "06", "07", "08", "09", "10", "11", "12", "13", "14", "15", "16", "17", "18", "19", "20", "21", "22", "23", "34", "25", "26", "27", "28", "29", "30", "31"];

    constructor(element, user, dialog) {
        this.element = element;
    }

}
