import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { Misc } from '../../../services/misc';
import { EditItem } from './edit-item';

export class PickerSettings {
    name_editable = false;
    can_add = true;
    can_delete = false;
    show_only_if_filter = false;
    empty_list_message = 'Empty list of options';
    help_item = 'search-input';
    place_holder_text = "Enter name from list or a new one";

    constructor(obj) {
        this.update(obj);
    }

    update(obj) {
        for (let key of Object.keys(obj)) {
            this[key] = obj[key]
        }
        return this;
    }
};

@inject(DOM.Element, I18N, DialogService, User, Theme, Misc)
export class Picker {
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    @bindable({ defaultBindingMode: bindingMode.twoWay }) settings: PickerSettings;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) selected_option;
    @bindable first_time = false;
    //----------------
    user: User;
    theme: Theme;
    agent = { size: 0 };
    misc: Misc;
    i18n: I18N;
    dialog: DialogService;
    new_item_placeholder = "";
    new_item_title = "";
    element;
    filter = "";

    constructor(element, i18n: I18N, dialog: DialogService, user: User, theme: Theme, misc: Misc) {
        this.element = element;
        this.dialog = dialog;
        this.i18n = i18n;
        this.new_item_placeholder = i18n.tr('multi-select.new-item-placeholder');
        this.new_item_title = i18n.tr('multi-select.new-item-title');
        this.user = user;
        this.theme = theme;
        this.misc = misc;
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('picker-change', {
            detail: {
                selected_option: this.selected_option,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    dispatch_new_item_event(event) {
        event.stopPropagation();
        let customEvent = new CustomEvent('new-name', {
            detail: {
                new_name: this.filter
            },
            bubbles: true
        });
        this.element.dispatchEvent(customEvent);
        return false;
    }

    edit_option_dialog(option, event) {
        event.stopPropagation();
        if (!this.user.privileges.ADMIN) return false;
        this.dialog.open({
            viewModel: EditItem, model: { item: option, can_delete: this.can_delete }, lock: true
        }).whenClosed(result => {
            if (result.wasCancelled) return;
            if (result.output.command == "remove-item") {
                this.remove_option(option);
            } else if (result.output.command == "rename") {
                this.name_changed(option)
            }
        });
    }

    remove_option(option) {
        let customEvent = new CustomEvent('remove-option', {
            detail: {
                option: option
            },
            bubbles: true
        });
        this.element.dispatchEvent(customEvent);
    }

    name_changed(option) {
        let customEvent = new CustomEvent('name-changed', {
            detail: {
                option: option
            },
            bubbles: true
        });
        this.element.dispatchEvent(customEvent);
    }

    @computedFrom('settings.can_delete')
    get can_delete() {
        return this.settings.can_delete;
    }

    @computedFrom('settings.can_add', 'filter', 'filter_size', 'first_time')
    get can_add() {
        return this.filter.length > 0 && this.settings.can_add && (this.first_time || this.filter_size == 0);
    }

    select_option(option){
        this.filter = option.name;
        let customEvent = new CustomEvent('item-selected', {
            detail: {
                option: option
            },
            bubbles: true
        });
        this.element.dispatchEvent(customEvent);
    }

    @computedFrom('agent.size')
    get filter_size() {
        return this.agent.size;
    }
}
 