import { bindable, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable options = [];
    selected_options = [];
    unselected_options = [];
    element;

    constructor(element) {
        this.element = element;
    }

    toggle_selection(option) {
        let i1 = this.selected_options.indexOf(option);
        let i2 = this.unselected_options.indexOf(option);
        let lst1, lst2;
        if (i1) {
            let x = this.selected_options.splice(i1, 1);
            this.unselected_options.push(x);
            this.unselected_options.sort(this.compare)
        } else {
            let x = this.unselected_options.splice(i2, 1);
            this.selected_options.push(x);
            this.selected_options.sort(this.compare)
        }
        this.dispatch_event();
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                value: this.selected_options;
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

}