import { bindable, inject, DOM, bindingMode, BindingEngine, computedFrom } from 'aurelia-framework';

export class ProgressBarCustomElement {
    @bindable final: number = 100;
    @bindable current: number = 0;

    constructor() {

    }

    @computedFrom('current')
    get percent() {
        return Math.round(100 * this.current / this.final);
    }

}
