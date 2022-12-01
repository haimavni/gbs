import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { Misc } from '../../../services/misc';

enum ui_kind {
    F_SELECT,
    F_BOOLEAN,
    F_INTEGER,
    F_DATE
}
export class FieldControl {
    @bindable name = '';
    @bindable type = '';
    @bindable description = '';
    @bindable options = [];


}
