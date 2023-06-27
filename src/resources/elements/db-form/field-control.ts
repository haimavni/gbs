import { I18N } from "@aurelia/i18n";
import { IUser } from "../../../services/user";
import { ITheme } from "../../../services/theme";
import { BindingMode, INode, bindable } from "aurelia";

export enum data_type {
    F_STRING = "string",
    F_BOOLEAN = "boolean",
    F_INTEGER = "integer",
    F_DATE = "date",
}

export class FieldControlCustomElement {
    @bindable name = "";
    @bindable type: data_type = null;
    @bindable description = "";
    @bindable options = [];
    //@bindable val = null;
    @bindable relation = null;
    @bindable has_relation = false;
    ui_selector = "";
    @bindable({ mode: BindingMode.twoWay }) int_val = 0;
    @bindable({ mode: BindingMode.twoWay }) date_val = "01.01.01";
    @bindable({ mode: BindingMode.twoWay }) bool_val = false;
    @bindable({ mode: BindingMode.twoWay }) str_val = "";
    relations = ["<", "<=", "==", ">=", ">"];

    constructor(
        @IUser private readonly user: IUser,
        @ITheme private readonly theme: ITheme,
        @INode private readonly element: HTMLElement,
        @I18N private readonly i18n: I18N
    ) {
        console.log("field control constructed");
    }

    get field_type() {
        let result: string = this.type;
        if (this.options.length > 1) {
            result += "-select";
        }
        return result;
    }

    dispatch_event() {
        let data: any;
        switch (this.type) {
            case "string":
                data = this.str_val;
                break;
            case "boolean":
                data = this.bool_val;
                break;
            case "integer":
                data = this.int_val;
                break;
            case "date":
                data = this.date_val;
                break;
        }
        let changeEvent = new CustomEvent("data_change", {
            detail: {
                data: data,
                field_name: this.name,
                relation: this.relation,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    selected(opt) {
        console.log("selected ", opt);
        this.bool_val = opt.value;
        this.dispatch_event();
    }

    handle_change(event) {
        console.log("select integer changed. integer_val: ", this.int_val);
        this.dispatch_event();
    }
}
