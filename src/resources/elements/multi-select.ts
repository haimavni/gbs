import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { User } from '../../services/user';

@inject(DOM.Element, User)
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    selected = new Set();
    @bindable user;
    element;
    selected_options = [];
    saved_options;
    filter = "";
    @bindable place_holder_text = "";
    width;
    @bindable height: 180;
    @bindable height_selected = 60;
    @bindable height_unselected = 120;

    constructor(element, user) {
        this.element = element;
        this.user = user;
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
        if (! this.height) {
            this.height = 180;
        }
        this.height_selected = Math.max(Math.round(this.height / 3), 40);
        this.height_unselected = this.height - this.height_selected;
        console.log("height, height_selected, height_unselected: ", this.height, this.height_selected, this.height_unselected);
    }


    is_selected(option) {
        if (this.selected.has(option.id)) {
            console.log("is selected? ", option.id, " ", option.name, " ", this.selected.has(option.id));
        }
        return this.selected.has(option.id);
    }

    merge_options(option, event) {
        console.log("merge ", option);
    }

    edit_option(option, event) {
        console.log("edit ", option);
    }

    onfocus(what) {
        alert(what)
    }

}