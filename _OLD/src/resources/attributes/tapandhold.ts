import { inject, customAttribute, bindable, bindingMode } from 'aurelia-framework';

@inject(Element)
@customAttribute('tapandhold')
export class TapAndHoldCustomAttribute {
    @bindable({ primaryProperty: true, defaultBindingMode: bindingMode.oneTime }) tolerance = 300;
    el: Element;
    ontouchstart: (event: Event) => any;
    ontouchend: (event: Event) => any;
    disableContextMenu: (event: Event) => any;

    constructor(el) {
        this.el = el;
        let timeout = null;
        let touchstart = null;
        this.ontouchend = (event) => {
            let touchend = performance.now();
            if (touchend - touchstart > this.tolerance) {
                el.dispatchEvent(new CustomEvent('longclick', { bubbles: true }));
                event.preventDefault();
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
                el.removeEventListener('touchend', this.ontouchend);
                clearTimeout(timeout);
            }, this.tolerance);
        }
        this.disableContextMenu = (event) => event.preventDefault();
    }

    attached() {
        this.el.addEventListener('touchstart', this.ontouchstart);
        this.el.addEventListener('contextmenu', this.disableContextMenu);
    }

    detatched() {
        this.el.removeEventListener('touchstart', this.ontouchstart);
        this.el.removeEventListener('touchend', this.ontouchend);
        this.el.removeEventListener('contextmenu', this.disableContextMenu);
    }
}
