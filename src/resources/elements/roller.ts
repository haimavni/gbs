import { bindable, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class RollerCustomElement {
    @bindable option_list = [];
    @bindable current;
    @bindable width;
    @bindable maxlen: number;
    @bindable charWidth = 10;
    @bindable left;

    idx = 0;
    element;

    constructor(element, user, dialog) {
        this.element = element;
    }

    shift(dif) {
        let i = this.idx + dif;
        if (i >= 0 && i < this.option_list.length) {
            this.idx = i;
            this.current = this.option_list[i];
        }
    }

    bind() {
        this.idx = this.option_list.indexOf(this.current);
        this.width = this.maxlen * this.charWidth + 2; //2 for the boundaries
        this.left = (this.width - 10) / 2;
    }

}
