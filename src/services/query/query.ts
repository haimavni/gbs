import { IMemberGateway } from "../gateway";
import { ITheme } from "../theme";
import { I18N } from "@aurelia/i18n";
import { IDialogController } from '@aurelia/dialog';

export class Query {
    table_name = "TblMembers";
    autoClose = "disabled";
    filter_menu_open = false;
    field_list = [];
    selected_field_list = [];
    negative = false;
    element;
    dirty;
    filter = "";
    current_field;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N,
        @IDialogController readonly dialog: IDialogController
    ) {}

    attached() {
        this.api
            .call_server_post("user_queries/available_fields", {
                table_name: this.table_name,
            })
            .then((response) => {
                console.log("field list: ", response.field_list);
                this.field_list = response.field_list;
            });
        this.fake_data();
    }

    apply_query() {
        //change named values to flat list
        this.api
            .call_server_post("user_queries/do_query", {
                table_name: this.table_name,
                fields: this.selected_field_list,
                negative: this.negative,
            })
            .then((response) => {
                console.log("response: ", response);
                this.dialog.ok(response.selected_ids);
            });
    }

    cancel() {
        this.dialog.cancel();
    }

    fix_object_value(value) {
        if (typeof value != "object") return value;
        if (Array.isArray(value)) return value;
        const result = [];
        for (const key of value) {
            result.push(value[key]);
        }
        return result;
    }

    set_current_field(field) {
        this.current_field = field;
        console.log("current field: ", this.current_field);
        for (const fld of this.field_list) {
            if (fld.name == this.current_field.name) {
                fld.cls = "qf-active";
            } else {
                fld.cls = "";
            }
        }
    }

    curr_class(field) {
        if (!this.current_field) return "";
        return this.current_field.name == field.name ? "active" : "";
    }

    save_query() {}

    fake_data() {
        this.selected_field_list = [
            { field_name: "date_of_alia", op: ">", value: "1929" },
            { field_name: "date_of_alia", op: "<", value: "1940" },
            { field_name: "date_of_birth", op: ">", value: "1930" },
            { field_name: "gender", op: "==", value: "M" },
        ];
    }
}
