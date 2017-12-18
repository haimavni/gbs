import { bindable, bindingMode, inject, DOM } from 'aurelia-framework';

@inject(DOM.Element)
export class SearchInputCustomElement {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value;
    @bindable placeholder = 'type someting';
    element;

    constructor(element) {
        this.element = element;
    }

    clear_text(event) {
        this.value = "";
    }

}
