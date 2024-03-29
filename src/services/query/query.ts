import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../gateway';
import { Theme } from '../theme';
import { I18N } from 'aurelia-i18n';
import { DialogController } from 'aurelia-dialog';


@autoinject()
export class Query {
    table_name = 'TblMembers';
    api;
    i18n;
    theme: Theme;
    autoClose = 'disabled';
    filter_menu_open = false;
    field_list = [];
    selected_field_list = [];
    negative = false;
    element;
    dirty;
    dialog: DialogController;
    filter = '';
    current_field;

    constructor(api: MemberGateway, theme: Theme, i18n: I18N, dialog: DialogController) {
        this.api = api;
        this.i18n = i18n;
        this.dialog = dialog;
        this.theme = theme;
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
        this.api.call_server_post('user_queries/do_query', { table_name: this.table_name, fields: this.selected_field_list, negative: this.negative })
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

    set_current_field(field) {
        this.current_field = field;
        console.log("current field: ", this.current_field);
        for (let fld of this.field_list) {
            if (fld.name == this.current_field.name) {
                fld.cls = 'qf-active'
            } else {
                fld.cls = '';
            }
        }
    }

    curr_class(field) {
        if (! this.current_field) return '';
        return this.current_field.name==field.name ? 'active' : '';
    }

    save_query() {
        
    }

    fake_data() {
        this.selected_field_list = [
            {field_name: 'date_of_alia', op: '>', value:'1929'},
            {field_name: 'date_of_alia', op: '<', value:'1940'},
            {field_name: 'date_of_birth', op: '>', value:'1930'},
            {field_name: 'gender', op: '==', value: 'M'}
        ]

    }

}
