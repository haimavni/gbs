import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';

@inject(DOM.Element)
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    selected = new Set();
    element;
    selected_options = [];
    unselected_options = [{ name: "drek", id: 999 }];
    filter = "";

    constructor(element) {
        this.element = element;
    }

    attached() {
        console.log("multi select bound ", this.options);
        this.unselected_options = this.options;
    }

    created() {
        console.log("multi select bound ", this.options);
        this.unselected_options = this.options;
    }

    activate() {
        alert('tinofet');
        console.log("multi select activated ", this.options);
        this.unselected_options = this.options;
    }

    toggle_selection(option) {
        if (this.selected.has(option.id)) {
            this.selected.delete(option.id)
        } else {
            this.selected.add(option.id);
        }
        this.dispatch_event();
        this.selected_options = this.options.filter(option => this.selected.has(option.id));
        this.unselected_options = this.options.filter(option => !this.selected.has(option.id));
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

    is_selected(option) {
        if (this.selected.has(option.id)) {
            console.log("is selected? ", option.id, " ", option.name, " ", this.selected.has(option.id));
        }
        return this.selected.has(option.id);
    }

}