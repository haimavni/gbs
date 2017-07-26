import { bindable, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class RollerCustomElement {
    @bindable option_list = [];
    @bindable current;
    @bindable width;
    @bindable left;

    idx = 0;
    element = "??";

    constructor(element, user, dialog) {
        this.element = element;
    }

    shift(dir) {
        this.idx = (this.idx + dir + this.option_list.length) % this.option_list.length;
        this.current = this.option_list[this.idx];
    }

    bind() {
        this.idx = this.option_list.indexOf(this.current);
        this.left = (this.width - 10) / 2;
    }

}
