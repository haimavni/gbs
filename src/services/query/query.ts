import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '.././gateway';
import { I18N } from 'aurelia-i18n';
import { DialogController } from 'aurelia-dialog';


@autoinject()
export class Query {
    table_name = 'TblMembers';
    api;
    i18n;
    autoClose = 'disabled';
    filter_menu_open = false;
    field_list = [];
    negative = false;
    element;
    dirty;
    dialog: DialogController;

    constructor(api: MemberGateway, i18n: I18N, dialog: DialogController) {
        this.api = api;
        this.i18n = i18n;
        this.dialog = dialog;
    }

    attached() {
        this.api.call_server_post('user_queries/available_fields', { table_name: this.table_name })
            .then(response => {
                console.log("field list: ", response.field_list);
                this.field_list = response.field_list
            })
       this.fake_data();
    }

    apply_query() {
        //change named values to flat list
        for (let field of this.field_list) {
            field.value = this.fix_object_value(field.value);
        }
        console.log("this.field_list: ", this.field_list);
        this.api.call_server_post('user_queries/do_query', { table_name: this.table_name, fields: this.field_list, negative: this.negative })
            .then(response => {
                console.log("response: ", response);
                this.dialog.ok(response.selected_ids);
            })
    }

    cancel() {
        this.dialog.cancel();
    }

    fix_object_value(value) {
        if (typeof value != 'object') return value;
        if (Array.isArray(value)) return value;
        let result = [];
        for (let key of value) {
            result.push(value[key])
        }
        return result;
    }

    save_query() {
        
    }

    fake_data() {
        this.field_list = [
            {field_name: 'date_of_alia', op: '>', value:'1929'},
            {field_name: 'date_of_alia', op: '<', value:'1940'},
            {field_name: 'date_of_birth', op: '>', value:'1930'}
        ]

    }

}
