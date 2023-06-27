import { I18N } from "@aurelia/i18n";
import { watch } from '@aurelia/runtime-html';
import { IUser } from "../../services/user";
import { INode, bindable } from "aurelia";

export class SelectorCustomElement {
    @bindable dict;
    @bindable selectedval;
    @bindable suffix;
    @bindable width = "100%";
    selected;
    selector;

    constructor(
        @INode private readonly element: HTMLElement,
        @I18N private readonly i18n: I18N,
        @IUser private readonly user: IUser
    ) {

    }

    @watch("suffix")
    get options() {
        let keys = Object.keys(this.dict);
        let suffix = this.suffix ? "-" + this.suffix : "";
        let options = [];
        for (let key of keys) {
            let name =
                "consts." + (key.replace(/_/g, "-") + suffix).toLowerCase();
            let selected = { name: this.i18n.tr(name), value: this.dict[key] };
            options.push(selected);
        }
        options.sort((option1, option2) => option1.value - option2.value);
        let el = this.selector; //document.getElementById("selector");
        if (el) el.style.width = this.width;
        return options;
    }

    @watch("selectedval")
    get display() {
        let selected = this.options.find(
            (opt) => opt.value == this.selectedval
        );
        if (selected) {
            return selected.name;
        } else {
            return "";
        }
    }

    selectedvalChanged(newValue, oldValue) {
        //console.log("selectedval changed from ", oldValue, " to ", newValue, " this value: ", this.selectedval);
    }

    selectedChanged(newValue, oldValue) {
        //console.log("selected changed from ", oldValue, " to ", newValue, " this value: ", this.selected);
    }
}
