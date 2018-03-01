import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Theme } from '../../services/theme';

const time_element_width = 12;

@inject(DOM.Element, I18N, Theme)
export class TimelineCustomElement {
    @bindable base_year = 1924;
    @bindable first_year = 1928;
    @bindable num_years = 100;
    last_year;
    i18n;
    theme;
    element;

    timeline_width = 1202;
    sides = ['left', 'right']
    items = [];
    first_year_position = 0;
    last_year_position = 1000;
    drag_me;

    constructor(element, i18n, theme: Theme) {
        //this.timeline_width = elementRect.width;
        this.i18n = i18n;
        this.theme = theme;
        this.drag_me = this.i18n.tr('photos.drag-me');
        this.items = [];
        this.element = element;
        for (let i = 0; i < this.num_years; i++) {
            this.items.push({ year: this.base_year + i });
        }
        this.last_year = this.base_year + this.num_years - 4;
    }

    attached() {
        this.first_year_position = (this.first_year - this.base_year - 3) * time_element_width;
        this.last_year_position = (this.last_year - this.base_year) * time_element_width;
    }

    dragstart(side, event) {
        console.log("dragstart ", side, event.detail);
    }

    dragmove(side, event) {
        switch (side) {
            case 'left':
                this.first_year_position += event.detail.dx;
                this.first_year_position = Math.max(0, this.first_year_position);
                this.first_year_position = Math.min(this.last_year_position - 4 * time_element_width, this.first_year_position);
                break;
            case 'right':
                this.last_year_position += event.detail.dx;
                this.last_year_position  = Math.min(this.timeline_width - 4 * time_element_width, this.last_year_position);
                this.last_year_position  = Math.max(this.first_year_position + 4 * time_element_width, this.last_year_position);
                break;
        }
        this.first_year = this.base_year + Math.floor(this.first_year_position / time_element_width) + 3;
        this.last_year = this.base_year + Math.floor(this.last_year_position / time_element_width);
    }

    dragend(side, event) {
        this.first_year_position = (this.first_year - this.base_year - 3) * time_element_width;
        this.last_year_position = (this.last_year - this.base_year) * time_element_width;
        this.dispatch_event();
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                first_year: this.first_year,
                last_year: this.last_year
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}


