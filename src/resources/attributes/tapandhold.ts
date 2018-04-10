import { inject, customAttribute, bindable, bindingMode } from 'aurelia-framework';

@inject(Element)
@customAttribute('tapandhold')
export class TapAndHoldCustomAttribute {
    @bindable({ primaryProperty: true, defaultBindingMode: bindingMode.oneTime }) tolerance = 300;
    el: Element;
    ontouchstart: (event) => any;
    ontouchend: (event) => any;

    constructor(el) {
        this.el = el;
        let timeout = null;
        let touchstart = null;
        this.ontouchend = (event) => {
            let touchend = performance.now();
            if (touchend - touchstart > this.tolerance) {
                el.dispatchEvent(new CustomEvent('longclick', { bubbles: true }));
                event.preventDefault();
                event.stopPropagation();
            }
            touchstart = null;
            clearTimeout(timeout);
            el.removeEventListener('touchend', this.ontouchend);
        }
        this.ontouchstart = (event) => {
            touchstart = performance.now();
            el.addEventListener('touchend', this.ontouchend);
            timeout = setTimeout(() => {
                el.dispatchEvent(new CustomEvent('longtouch', { bubbles: true }));
                event.preventDefault();
                event.stopPropagation();
            }, this.tolerance);
        }
    }

    attached() {
        this.el.addEventListener('touchstart', this.ontouchstart);
    }

    detatched() {
        this.el.removeEventListener('touchstart', this.ontouchstart);
        this.el.removeEventListener('touchend', this.ontouchend);
    }
}
