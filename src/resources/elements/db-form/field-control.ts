import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { Misc } from '../../../services/misc';

export enum data_type {
    F_STRING='string',
    F_BOOLEAN = 'boolean',
    F_INTEGER = 'integer',
    F_DATE = 'date'
}

@inject(User, Theme, DOM.Element, I18N)
export class FieldControlCustomElement {
    i18n: I18N;
    user: User;
    theme: Theme;
    @bindable name = '';
    @bindable type: data_type = null;
    @bindable description = '';
    @bindable options = [];
    @bindable val = null;
    element;
    ui_selector = '';
    int_val = 0;
    bool_val = false;
    str_val = '';
    date_val = '01.01.01'

    constructor(user: User, theme: Theme, element, i18n) {
        this.i18n = i18n;
        this.user = user;
        this.theme = theme;
        this.element = element;
        console.log("field control constructed")
    }

    get field_type() {
        let result: string = this.type;
        if (this.options.length > 1) {
            result += '-select'
        }
        return result;
    }

    dispatch_event() {
        let data: any;
        switch(this.type) {
            case 'string':
                data = this.str_val;
                break;
            case 'boolean':
                data = this.bool_val;
                break;
            case 'integer':
                data = this.int_val;
                break;
            case 'date':
                data = this.date_val;
                break;
        }
        let changeEvent = new CustomEvent('change', {
            detail: {
                data: data,
                field_name: this.name
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    selected(opt) {
        console.log("selected ", opt);
        this.bool_val = opt.value;
        this.dispatch_event();
    }
}
