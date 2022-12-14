import { bindable, ICustomElementViewModel } from 'aurelia';

export class ProgressBarCustomElement implements ICustomElementViewModel {
    @bindable final = 100;
    @bindable current = 0;

    get percent() {
        if (!this.current) return 0;
        return Math.round((100 * this.current) / this.final);
    }
}
