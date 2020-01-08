import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { set_intersection, set_union, set_diff } from '../../services/set_utils';
import { CustomDialog } from '../../services/custom-dialog';
import { DialogService } from 'aurelia-dialog';
import * as Collections from 'typescript-collections';
import { I18N } from 'aurelia-i18n';
import { User } from '../../services/user';

@inject(DOM.Element, I18N, DialogService, User)
export class MultiQuestionaire {
}
