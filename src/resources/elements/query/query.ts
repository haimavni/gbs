import { bindable, inject, DOM, bindingMode, computedFrom, autoinject } from 'aurelia-framework';
import { MemberGateway } from '../../../services/gateway';
import { I18N } from 'aurelia-i18n';
import { Misc } from '../../../services/misc';
import { DialogService } from 'aurelia-dialog';

@inject(DOM.Element, MemberGateway, I18N, DialogService)
export class QueryCustomElement {
    api;
    i18n;
    autoClose = 'disabled';
    filter_menu_open = false;
    table_name = 'TblMembers';
    fields = [];
    element;
    dirty;
    dialog: DialogService;

    constructor(element, api: MemberGateway, i18n: I18N, dialog: DialogService) {
        this.api = api;
        this.i18n = i18n;
        this.element = element;
        this.dialog = dialog;
    }

    attached() {
        this.api.call_server('user_qureies/available_fields', { table_name: this.table_name })
            .then(response => {
                console.log("field list: ", response.field_list)
            })
       this.fake_data()  ;
    }

    apply_query() {
        this.api.call_server('user_queries/do_query', { table_name: this.table_name, fields: this.fields })
            .then(response => {
                console.log("response: ", response)
            })
    }

    fake_data() {
        this.fields = [
            {field_name: 'date_of_alia', op: '<', value:'1950'}
        ]

    }

}
