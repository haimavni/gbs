import { bindable, IEventAggregator, INode } from 'aurelia';

export class VideoBoxCustomElement {
    @bindable width = 360;
    @bindable src: string;
    @bindable aspectRatio = [16, 9];
    height = 160;

    constructor(
        @INode readonly element: HTMLElement,
        @IEventAggregator readonly eventAggregator: IEventAggregator
    ) {
        this.element = element;
        this.eventAggregator = eventAggregator;
    }

    attached() {
        const h = (this.aspectRatio[1] * this.width) / this.aspectRatio[0];
        this.height = Math.round(h);
    }
}
