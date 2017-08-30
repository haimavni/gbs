import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';

@inject(DOM.Element, I18N)
export class SelectorCustomElement {
    @bindable dict;
    @bindable selectedval;
    selected;
    options;
    i18n;
    element;

    constructor(element, i18n) {
        this.element = element;
        this.i18n = i18n;
    }

    attached() {
        let keys = Object.keys(this.dict);
        this.options = [];
        for (let key of keys) {
            let name = 'consts.' + key.replace(/_/g, '-').toLowerCase();
            let selected = { name: this.i18n.tr(name), value: this.dict[key] }
            this.options.push(selected);
        }
        this.options.sort((option1, option2) => option1.value - option2.value);
    }

    selectedvalChanged(newValue, oldValue) {
        console.log("selectedval changed from ", oldValue, " to ", newValue, " this value: ", this.selectedval);
    }

    selectedChanged(newValue, oldValue) {
        console.log("selected changed from ", oldValue, " to ", newValue, " this value: ", this.selected);
    }

}

