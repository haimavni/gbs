import { I18N } from "@aurelia/i18n";
import { IUser } from "../../../services/user";
import { ITheme } from "../../../services/theme";
import { Misc } from "../../../services/misc";
import { data_type } from "./field-control";
import { Query } from "../../../services/query/query";
import { IMemberGateway } from "../../../services/gateway";
import { forEach } from "typescript-collections/dist/lib/arrays";
import { INode, bindable } from "aurelia";

export class TableFormCustomElement {
    field_list = [];
    @bindable table_name = "";
    @bindable record_id = null;

    constructor(
        @IUser private readonly user: IUser,
        @ITheme private readonly theme: ITheme,
        @INode private readonly element: HTMLElement,
        @I18N private readonly i18n: I18N,
        @IMemberGateway private readonly api: IMemberGateway
    ) {}

    attached() {
        this.api
            .call_server_post("user_queries/available_fields", {
                table_name: this.table_name,
                record_id: this.record_id,
            })
            .then((response) => {
                console.log("field list: ", response.field_list);
                this.field_list = response.field_list;
            });
        //this.fake_data();
    }

    get_field_info(field) {
        let result = {
            name: field.name,
            type: field.type,
            description: field.description,
            current_value: field.current_value,
            options: this.parse_options(field.options),
        };
        return result;
    }

    parse_options(options): any[] {
        let lst = options.split("|");
        let result = [];
        for (let elem of lst) {
            let parts = elem.split("=");
            let name = parts[0];
            let value = parts[1];
            result.push({ name: name, value: value });
        }
        return result;
    }
}
