import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { Misc } from '../../../services/misc';

export enum ui_kind {
    F_STRING,
    F_SELECT,
    F_BOOLEAN,
    F_INTEGER,
    F_DATE
}
export class FieldControl {
    i18n: I18N;
    @bindable name = '';
    @bindable type: ui_kind;
    @bindable description = '';
    @bindable options = [];
    ui_selector = '';

    constructor(i18n: I18N) {
        this.i18n = i18n;
    }

    get ui_kind() {
        switch(this.type) {
            case ui_kind.F_STRING:
                return 'string';
            case ui_kind.F_SELECT:
                return 'select';
            case ui_kind.F_BOOLEAN:
                if (this.options.length == 2)
                    return 'bool-opt';
                return 'bool';
            case ui_kind.F_INTEGER:
                return 'integer';
            case ui_kind.F_DATE:
                return 'date';
        }
    }
}
