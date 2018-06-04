import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { set_intersection, set_union, set_diff } from '../../../services/set_utils';
import { CustomDialog } from '../../../services/custom-dialog';
import { DialogService } from 'aurelia-dialog';
import * as Collections from 'typescript-collections';
import { I18N } from 'aurelia-i18n';

let default_multi_select_settings_new = {
    clear_filter_after_select: false,
    mergeable: false,
    name_editable: false,
    can_set_sign: false,
    can_add: false,
    can_delete: false,
    show_only_if_filter: false,
    height_selected: 120,
    height_unselected: 120
};

@inject(DOM.Element, I18N, DialogService)
export class MultiSelectNewCustomElement {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selected_options = [];
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) settings;

    @bindable place_holder_text = "";
    @bindable can_edit = true;
    selected_options_set = new Set();
    open_group = 0;
    element;
    dialogService;
    new_item_placeholder;
    new_item_title;
    filter = "";
    width;
    inner_width;
    anchor = '<button class="btn btn-success" style="padding-top:9px;"><i class="far fa-lg fa-plus-square"></i></button>';
    new_item_name;
    lineHeight = 20;

    constructor(element, i18n: I18N, dialogService: DialogService) {
        this.element = element;
        this.dialogService = dialogService;
        this.new_item_placeholder = i18n.tr('multi-select.new-item-placeholder');
        this.new_item_title = i18n.tr('multi-select.new-item-title')
    }

    attached() {
        clean(this.settings);
        this.settings = Object.assign({}, default_multi_select_settings_new, this.settings);
    }

    select_option(option) {
        let g = this.assign_group_number();
        let item = { option: option, group_number: g };
        this.selected_options.push(item);
        let arr = this.selected_options.map((item) => item.option.name);
        this.selected_options_set = new Set(arr);
        //this.selected_options_set.add(option.name); changes are not detected
        this.sort_items();
    }

    unselect_item(item, index) {
        this.selected_options.splice(index, 1);
        let arr = this.selected_options.map((item) => item.option.name);
        this.selected_options_set = new Set(arr);
        this.sort_items();
        //this.selected_options_set.delete(item.option.name); like the above
    }

    toggle_group(group_number) {
        if (group_number == this.open_group) {
            this.open_group = 0;
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
        return this.selected_options[this.selected_options.length - 1].group_number + 1;
    }

    assign_group_number() {
        if (this.open_group) {
            return this.open_group;
        } else {
            return this.find_free_group_number();
        }
    }

    sort_items() {
        this.selected_options = this.selected_options.sort((item1, item2) => item1.group_number - item2.group_number);
        for (let item of this.selected_options) item.last = false;
        let n = this.selected_options.length;
        if (n == 0) {
            this.dispatch_event();
            return;
        }
        let i = 0;
        let g = 0;
        let prev_item = null;
        for (let item of this.selected_options) {
            if (item.group_number != g) {
                g = item.group_number;
                i += 1;
                item.first = true;
                if (prev_item) {
                    prev_item.last = true;
                }
            } else {
                item.first = false;
            }
            prev_item = item;
            if (this.open_group == item.group_number) {
                this.open_group = i;
            }
            item.group_number = i;
        }
        this.selected_options[n-1].last = true;
        console.log("sort items: ", this.selected_options);
        this.dispatch_event();
    }

    @computedFrom('selected_options_set')
    get display_option_list() {
        if (!this.settings.show_only_if_filter) {
            return true;
        }
        if (this.selected_options_set.size == 0) {
            return false;
        }
        return true;
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('ms-change', {
            detail: {
                selected_options: this.selected_options,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    @computedFrom('settings.mergeable')
    get can_merge() {
        return this.settings.mergeable;
    }

    @computedFrom('settings.name_editable')
    get can_edit_name() {
        return this.settings.name_editable;
    }

    @computedFrom('settings.can_set_sign')
    get can_set_sign() {
        return this.settings.can_set_sign;
    }

    @computedFrom('settings.can_add')
    get can_add() {
        return this.settings.can_add;
    }

    @computedFrom('settings.can_delete')
    get can_delete() {
        return this.settings.can_delete;
    }

}

function clean(obj) {
  for (var propName in obj) { 
    if (obj[propName] === null || obj[propName] === undefined) {
      delete obj[propName];
    }
  }
}
