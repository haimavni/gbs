import { bindable, inject, DOM, bindingMode, BindingEngine } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(DOM.Element, EventAggregator, BindingEngine)
export class VideoBoxCustomElement {
    @bindable width = 360;
    @bindable src: string;
    @bindable aspectRatio = [16,9];
    height = 160;
    element;
    eventAggregator;

    constructor(element, eventAggregator: EventAggregator, bindingEngine) {
        this.element = element;
        this.eventAggregator = eventAggregator;
    }

    attached() {
        let h = this.aspectRatio[1] * this.width / this.aspectRatio[0];
        this.height = Math.round(h)
    }
}
