import { IEventAggregator, INode, bindable } from "aurelia";

export class VideoBoxCustomElement {
    @bindable width = 360;
    @bindable src: string;
    @bindable aspectRatio = [16, 9];
    height = 0;

    constructor(
        @INode private readonly element: HTMLElement,
        @IEventAggregator private readonly eventAggregator: IEventAggregator
    ) {

    }

    attached() {
        let h = (this.aspectRatio[1] * this.width) / this.aspectRatio[0];
        this.height = Math.round(h);
    }
}
