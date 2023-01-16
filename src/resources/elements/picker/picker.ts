import { bindable, IDialogService, INode, BindingMode } from 'aurelia';
import { I18N } from '@aurelia/i18n';
import { IUser } from '../../../services/user';
import { ITheme } from '../../../services/theme';
import { IMisc } from '../../../services/misc';
import { EditItem } from './edit-item';

export class PickerSettings {
    name_editable = false;
    can_add = true;
    can_delete = false;
    show_only_if_filter = false;
    empty_list_message = 'Empty list of options';
    help_topic = 'search-input';
    place_holder_text = 'Enter name from list or a new one';

    constructor(obj) {
        this.update(obj);
    }

    update(obj) {
        for (const key of Object.keys(obj)) {
            this[key] = obj[key];
        }
        return this;
    }
}

export class Picker {
    @bindable({ mode: BindingMode.twoWay }) options = [];
    @bindable({ mode: BindingMode.twoWay })
    settings: PickerSettings;
    @bindable({ mode: BindingMode.twoWay }) selected_option;
    @bindable category = 'item';
    @bindable first_time = false;
    //----------------
    agent = { size: 0 };
    new_item_placeholder = '';
    new_item_title = '';
    filter = '';
    option_was_selected = false;

    constructor(
        @INode readonly element: HTMLElement,
        @I18N readonly i18n: I18N,
        @IDialogService readonly dialog: IDialogService,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @IMisc readonly misc: IMisc
    ) {
        this.new_item_placeholder = i18n.tr(
            'multi-select.new-item-placeholder'
        );
        this.new_item_title = i18n.tr('multi-select.new-item-title');
    }

    dispatch_event() {
        const changeEvent = new CustomEvent('picker-change', {
            detail: {
                selected_option: this.selected_option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    dispatch_new_item_event(event) {
        event.stopPropagation();
        const customEvent = new CustomEvent('new-name', {
            detail: {
                new_name: this.filter,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
        this.filter = '';
        return false;
    }

    edit_option_dialog(option, event) {
        event.stopPropagation();
        if (!this.user.privileges.ADMIN && !this.user.debugging) return false;
        this.dialog
            .open({
                viewModel: EditItem,
                model: {
                    item: option,
                    can_delete: this.can_delete,
                    category: this.category,
                },
                lock: true,
            })
            .whenClosed((result) => {
                if (result.wasCancelled) return;
                if (result.output.command == 'remove-item') {
                    this.remove_option(option);
                } else if (result.output.command == 'modify-item') {
                    this.modify_item(option);
                }
            });
    }

    remove_option(option) {
        const customEvent = new CustomEvent('remove-item', {
            detail: {
                option: option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
        const idx = this.options.findIndex((opt) => opt.id == option.id);
        this.options.splice(idx, 1);
    }

    modify_item(option) {
        const customEvent = new CustomEvent('item-modified', {
            detail: {
                option: option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    get can_delete() {
        return this.settings.can_delete;
    }

    get can_add() {
        return (
            this.user.editing &&
            this.filter.length > 0 &&
            this.settings.can_add &&
            (this.first_time || this.filter_size == 0)
        );
    }

    select_option(option) {
        this.option_was_selected = true;
        this.filter = option.name;
        const customEvent = new CustomEvent('item-selected', {
            detail: {
                option: option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    unselect_option() {
        this.option_was_selected = false;
        this.filter = '';
        const customEvent = new CustomEvent('unselect', {
            detail: {
                option: 'unselect',
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    get filter_size() {
        return this.agent.size;
    }

    get check_option_selected() {
        if (!this.selected_option) this.option_was_selected = false;
        this.filter = '';
        return false;
    }
}
