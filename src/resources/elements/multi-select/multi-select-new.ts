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
    selected_options_set = new Set();
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

    select_option(option) {
        let g = this.find_free_group_number();
        let item = { option: option, group_num: g };
        this.selected_options.push(item);
        this.selected_options_set.add(option.id);
    }

    unselect_item(item, index) {
        this.selected_options.splice(index, 1);
        this.selected_options_set.delete(item.option.id);
    }

    toggle_group(group_number) {
        if (group_number == this.open_group) {
            this.open_group = null;
        } else {
            this.open_group = group_number;
        }
    }

    move_item(item) {
        if (this.open_group == item.group_number) {  // remove item from the open group
            item.group_number = this.find_free_group_number();
        } else if (this.open_group) {                // 
            item.group_number = this.open_group;
        } // else do nothing?
        this.sort_items();
    }

    find_free_group_number() {
        if (this.selected_options.length == 0) return 1;
        return this.selected_options[this.selected_options.length-1].group_number + 1;
    }

    sort_items() {
        this.selected_options.sort((item1, item2) => item1.group_number - item2.group_number);
        let i = 0;
        let g = 0;
        for (let item of this.selected_options) {
            if (item.group_number != g) {
                g = item.group_number;
                i += 1;
                item.first = true
            } else {
                item.first = false;
            }
            if (this.open_group == item.group_number) {
                this.open_group = i;
            }
            item.group_number = i;
        }
    }


}
