import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { set_intersection, set_union, set_diff } from '../../../services/set_utils';
import { CustomDialog } from '../../../services/custom-dialog';
import { DialogService } from 'aurelia-dialog';
import * as Collections from 'typescript-collections';
import { I18N } from 'aurelia-i18n';

let default_multi_select_options = {
    clear_filter_after_select: false,
    mergeable: false,
    name_editable: false,
    can_set_sign: false,
    can_add: false,
    can_delete: false,
    show_only_if_filter: false
};
export default default_multi_select_options;

@inject(DOM.Element, I18N, DialogService)
export class MultiSelectNewCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) all_selected = new Set([]);
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selected_options = [];
    open_group;
    element;
    dialogService;
    new_item_placeholder;
    new_item_title;

    constructor(element, i18n: I18N, dialogService: DialogService) {
        this.element = element;
        this.dialogService = dialogService;
        this.new_item_placeholder = i18n.tr('multi-select.new-item-placeholder');
        this.new_item_title = i18n.tr('multi-select.new-item-title')
    }

}
