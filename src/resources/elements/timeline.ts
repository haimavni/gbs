import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { Theme } from '../../services/theme';

const time_element_width = 11;

@inject(DOM.Element, I18N, Theme)
export class TimelineCustomElement {
    @bindable base_year = 1923;
    @bindable first_year = 1928;
    @bindable num_years = 100;
    base_year_at_start = 0;
    start_at_left = false;
    start_at_right = false;
    shifting = false;
    distance = 0;
    last_year;
    i18n;
    theme;
    element;

    timeline_width = 1102;
    sides = ['left', 'right']
    items = [];
    first_year_position = 0;
    last_year_position = 1068;
    drag_me;

    constructor(element, i18n, theme: Theme) {
        //this.timeline_width = elementRect.width;
        this.i18n = i18n;
        this.theme = theme;
        this.timeline_width = this.num_years * time_element_width + 2;
        this.last_year_position = this.timeline_width - 4 * time_element_width;
        this.drag_me = this.i18n.tr('photos.drag-me');
        this.element = element;
        this.items = [];
        for (let i = 0; i < this.num_years; i++) {
            this.items.push({ year: this.base_year + i });
        }
        this.last_year = this.base_year + this.num_years - 4;
    }

    attached() {
        this.first_year_position = (this.first_year - this.base_year - 3) * time_element_width;
        this.last_year_position = (this.last_year - this.base_year) * time_element_width;
        this.items = [];
        for (let i = 0; i < this.num_years; i++) {
            this.items.push({ year: this.base_year + i });
        }
        this.last_year = this.base_year + this.num_years - 4;
    }

    dragstart(side, event) {
        let first_year_at_start = this.first_year;
        let last_year_at_start = this.last_year;
        this.base_year_at_start = this.base_year;
        this.start_at_left = first_year_at_start == this.base_year + 3;
        this.start_at_right = last_year_at_start == this.base_year + this.num_years - 4;
        this.distance = 0;
        this.shifting = false;
    }

    dragmove(side, event) {
        console.log("dx: ", event.detail.dx);
        switch (side) {
            case 'left':
                if (this.start_at_left && event.detail.dx < 0 && this.distance == 0) {
                    this.shifting = true;
                }
                if (this.shifting) {
                    this.distance += event.detail.dx;
                } else {
                    this.first_year_position += event.detail.dx;
                    this.first_year_position = Math.min(this.last_year_position - 4 * time_element_width, this.first_year_position);
                    this.first_year_position = Math.max(0, this.first_year_position)
                }
                break;
            case 'right':
                if (this.start_at_right && event.detail.dx > 0 && this.distance == 0) {
                    this.shifting = true;
                }
                if (this.shifting) {
                    this.distance += event.detail.dx;
                } else {
                    this.last_year_position += event.detail.dx
                    this.last_year_position = Math.max(this.first_year_position + 4 * time_element_width, this.last_year_position);
                    this.last_year_position = Math.min(this.timeline_width - 4 * time_element_width, this.last_year_position);
                }
                break;
        }
        if (this.shifting) {
            let gap = Math.round(this.distance / time_element_width);
            this.base_year = this.base_year_at_start + gap;
            this.first_year = this.base_year + 3;
            this.last_year = this.base_year + this.num_years - 4;
        } else {
            this.first_year = this.base_year + Math.round(this.first_year_position / time_element_width) + 3;
            this.last_year = this.base_year + Math.round(this.last_year_position / time_element_width);
        }
    }

    dragend(side, event) {
        this.first_year_position = Math.round(this.first_year_position / time_element_width) * time_element_width;;
        this.last_year_position = Math.round(this.last_year_position / time_element_width) * time_element_width;;
        if (this.shifting) {
            this.first_year_position = 0;
            this.last_year_position = this.timeline_width - 4 * time_element_width;
            this.shifting = false;
            for (let i = 0; i < this.num_years; i++) {
                this.items[i].year = this.base_year + i;
            }
        }
        this.dispatch_event();
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                first_year: this.first_year,
                last_year: this.last_year,
                base_year: this.base_year
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}
