import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    selected = new Set();
    element;
    selected_options = [];
    saved_options;
    filter = "";
    @bindable place_holder_text = "";
    width;

    constructor(element) {
        this.element = element;
    }

    toggle_selection(option) {
        if (this.selected.has(option.id)) {
            this.selected.delete(option.id)
        } else {
            this.selected.add(option.id);
        }
        if (!this.saved_options) {
            this.saved_options = this.options.splice(0);
        }
        this.selected_options = this.saved_options.filter(option => this.selected.has(option.id));
        this.options = this.saved_options.filter(option => !this.selected.has(option.id));
        this.dispatch_event();
        this.filter = ""
        console.log("selected: ", this.selected);
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                selected_options: this.selected_options
            },
            bubbles: true
        });
        console.log("about to dispath ", this.selected_options);
        this.element.dispatchEvent(changeEvent);
    }

    attached() {
        const elementRect = this.element.getBoundingClientRect();
        this.width = Math.round(elementRect.width) - 50;
    }


    is_selected(option) {
        if (this.selected.has(option.id)) {
            console.log("is selected? ", option.id, " ", option.name, " ", this.selected.has(option.id));
        }
        return this.selected.has(option.id);
    }

    onfocus(what) {
        alert(what)
    }

}