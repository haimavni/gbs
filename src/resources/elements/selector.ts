import { bindable, BindingMode, ICustomElementViewModel, INode } from 'aurelia';
import { I18N } from '@aurelia/i18n';
import { IUser } from '../../services/user';

export class SelectorCustomElement implements ICustomElementViewModel {
    @bindable dict;
    @bindable selectedval;
    @bindable suffix;
    @bindable width = '100%';
    selected;
    selector;

    constructor(
        @INode readonly element: HTMLElement,
        @I18N readonly i18n: I18N,
        @IUser readonly user: IUser
    ) {}

    get options() {
        const keys = Object.keys(this.dict);
        const suffix = this.suffix ? '-' + this.suffix : '';
        const options = [];
        for (const key of keys) {
            const name =
                'consts.' + (key.replace(/_/g, '-') + suffix).toLowerCase();
            const selected = {
                name: this.i18n.tr(name),
                value: this.dict[key],
            };
            options.push(selected);
        }
        options.sort((option1, option2) => option1.value - option2.value);
        const el = this.selector; //document.getElementById("selector");
        if (el) el.style.width = this.width;
        return options;
    }

    get display() {
        const selected = this.options.find(
            (opt) => opt.value == this.selectedval
        );
        if (selected) {
            return selected.name;
        } else {
            return '';
        }
    }

    selectedvalChanged(newValue, oldValue) {
        //console.log("selectedval changed from ", oldValue, " to ", newValue, " this value: ", this.selectedval);
    }

    selectedChanged(newValue, oldValue) {
        //console.log("selected changed from ", oldValue, " to ", newValue, " this value: ", this.selected);
    }
}
