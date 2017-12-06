import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';

@inject(DOM.Element, I18N)
export class TimelineCustomElement {
    @bindable first_year = 1928;
    @bindable last_year = 2018;
    @bindable base_year = 1925;
    @bindable num_years = 100;
    i18n;
    element;

    timeline_width=1202;
    step_size = 11;
    items = [];


    constructor(element, i18n) {
       //this.timeline_width = elementRect.width;
        this.i18n = i18n;
        this.items = [];
        this.element = element;
        for (let i=0; i < this.num_years; i++) {
            this.items.push({title: this.base_year + i});
        }
    }

    activate() {
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        console.log("activate: elementRect: ", elementRect);
        /*this.items = [];
        for (let i=0; i < 100; i++) {
            this.items.push({title: 1928 + i});
        }*/
    }

    bind() {
        const elementRect = this.element.getBoundingClientRect();
        const left = elementRect.left + window.scrollX;
        let top = elementRect.top + elementRect.height;
        console.log("BIND: elementRect: ", elementRect);
        /*this.items = [];
        for (let i=0; i < 100; i++) {
            this.items.push({title: 1928 + i});
        }*/
    }

}


