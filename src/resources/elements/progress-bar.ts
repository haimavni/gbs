import { bindable } from "aurelia";
import { watch } from '@aurelia/runtime-html';

export class ProgressBarCustomElement {
    @bindable final: number = 100;
    @bindable current: number = 0;

    constructor() {

    }

    @watch('current')
    get percent() {
        if (! this.current) return 0;
        return Math.round(100 * this.current / this.final);
    }

}
