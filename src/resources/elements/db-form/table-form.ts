import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { Misc } from '../../../services/misc';
import { data_type } from './field-control';
import { Query } from "../../../services/query/query";
import { MemberGateway } from '../../../services/gateway';
import { forEach } from 'typescript-collections/dist/lib/arrays';

@inject(User, Theme, DOM.Element, I18N, MemberGateway)
export class TableFormCustomElement {
    i18n: I18N;
    user: User;
    theme: Theme;
    api: MemberGateway;
    element;
    field_list = [];
    @bindable table_name = '';
    @bindable record_id = null;

    constructor(user: User, theme: Theme, element, i18n, api) {
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.element = element;
        this.api = api;
    }

    attached() {
        this.api.call_server_post('user_queries/available_fields', { table_name: this.table_name, record_id: this.record_id })
            .then(response => {
                console.log("field list: ", response.field_list);
                this.field_list = response.field_list
            })
       //this.fake_data();
    }

    get_field_info(field) {
        let result = {
            name: field.name,
            type: field.type,
            description: field.description,
            current_value: field.current_value,
            options: this.parse_options(field.options)
        }
        return result;
    }

    parse_options(options) {
        let lst = options.split('|');
        let result = [];
        for (let elem of lst) {
            let parts = elem.split('=')
            let name = parts[0]
            let value = parts[1]
            result.push({name: name, value: value})
        }
        return result
    }

}
