import { bindable, bindingMode, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class SearchInputCustomElement {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value;
    @bindable placeholder = 'type someting';
    @bindable height;
    @bindable help_topic = 'search-input';
    element;

    constructor(element) {
        this.element = element;
    }

    clear_text(event) {
        this.value = "";
    }

    input_changed(event) {
        /*let key = event.key;
        if (key == "Enter") {
            this.dispatch_event();
        }*/
        this.dispatch_event();
        return true;
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('filter-change', {
            detail: {
                value: this.value,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }
    

}
