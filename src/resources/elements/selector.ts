import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { I18N } from 'aurelia-i18n';
import { User } from '../../services/user';

@inject(DOM.Element, I18N, User)
export class SelectorCustomElement {
    @bindable dict;
    @bindable selectedval;
    @bindable suffix;
    @bindable width = "100%";
    selected;
    //options;
    i18n;
    user;
    element;

    constructor(element, i18n, user) {
        this.element = element;
        this.i18n = i18n;
        this.user = user;
    }

    @computedFrom('suffix')
    get options() {
        let keys = Object.keys(this.dict);
        let suffix = this.suffix ? '-' + this.suffix : '';
        let options = [];
        for (let key of keys) {
            let name = 'consts.' + (key.replace(/_/g, '-') + suffix).toLowerCase();
            let selected = { name: this.i18n.tr(name), value: this.dict[key] }
            options.push(selected);
        }
        options.sort((option1, option2) => option1.value - option2.value);
        let el = document.getElementById("selector");
        if (el) el.style.width = this.width;
        return options;
    }

    @computedFrom('selectedval')
    get display() {
        let selected = this.options.find(opt=>opt.value==this.selectedval);
        if (selected) {
            return selected.name;
        } else {
            return "";
        }
    }

    selectedvalChanged(newValue, oldValue) {
        console.log("selectedval changed from ", oldValue, " to ", newValue, " this value: ", this.selectedval);
    }

    selectedChanged(newValue, oldValue) {
        console.log("selected changed from ", oldValue, " to ", newValue, " this value: ", this.selected);
    }

}

