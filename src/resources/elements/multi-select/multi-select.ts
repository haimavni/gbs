import { bindable, INode, BindingMode } from 'aurelia';
import { IDialogService } from '@aurelia/dialog';
import { I18N } from '@aurelia/i18n';
import { EditTopic } from './edit-topic';
import { IUser } from '../../../services/user';
import { ITheme } from '../../../services/theme';
import { IMisc } from '../../../services/misc';

export class MultiSelectSettings {
    clear_filter_after_select = false;
    mergeable = false;
    name_editable = false;
    can_set_sign = false;
    can_add = false;
    can_delete = false;
    can_group = true;
    show_only_if_filter = false;
    height_selected = 120;
    height_unselected = 132;
    hide_higher_options = false; //hide options that are collections of lower level options
    empty_list_message = 'Empty list of options';
    help_topic = 'search-input';
    to_show_untagged = false;
    single = false;
    start_open = false;
    auto_select = true;

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

export class MultiSelectCustomElement {
    @bindable({ mode: BindingMode.twoWay }) options = [];
    @bindable({ mode: BindingMode.twoWay }) selected_options = [];
    @bindable({ mode: BindingMode.twoWay }) settings;
    @bindable({ mode: BindingMode.twoWay }) has_groups;
    @bindable({ mode: BindingMode.twoWay }) clear_selections_now;

    @bindable highlight_unselectors;
    @bindable place_holder_text = '';
    @bindable can_edit = true;
    @bindable option_groups = []; // list looks like [(parent, children)...]
    @bindable first_time = false;
    @bindable category = '';
    selected_options_set = new Set();
    open_group = 0;
    new_item_placeholder;
    new_item_title;
    filter = '';
    width;
    inner_width;
    anchor =
        '<button class="btn btn-success" style="padding-top:9px;"><i class="far fa-lg fa-plus-square"></i></button>';
    new_item_name;
    lineHeight = 20;
    scroll_area;
    to_show_untagged = false;
    agent = { size: 0 };
    group_selected = false;
    show_untagged_caption = '';

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

    attached() {
        this.calc_untagged_caption();
        /*clean(this.settings);
        this.settings = Object.assign({}, default_multi_select_settings, this.settings);*/
    }

    expand(option) {
        for (const opt of this.options) {
            if (!opt.level) opt.level = 0;
        }
        this.options = this.options.filter((opt) => opt.level <= option.level);
        for (const opt of this.options) {
            opt.expanded = false;
        }
        let sub_options = this.get_sub_options(option);
        sub_options = this.misc.deepClone(sub_options);
        const idx = this.options.findIndex(
            (item) => item.name == option.name && item.level == option.level
        );
        const level = option.level ? option.level + 1 : 1;
        sub_options = sub_options.filter((opt) => Boolean(opt)); //irrelevant options must be filtered out
        for (const opt of sub_options) {
            opt.level = level;
            opt.parent = option.id;
        }
        this.options.splice(idx + 1, 0, ...sub_options);
        option.expanded = true;
    }

    collapse(option) {
        this.options = this.options.filter((opt) => opt.level <= option.level);
        option.expanded = false;
        //filter out all children
    }

    select_option(option) {
        if (option.topic_kind == 1 && this.hide_higher) {
            if (option.expanded) {
                this.collapse(option);
            } else {
                this.expand(option);
            }
            return;
        }
        if (this.settings.single) {
            this.selected_options = [];
            this.selected_options_set = new Set();
        }
        this.to_show_untagged = false;
        let g;
        let b = false;
        if (this.user.editing && option.topic_kind == 0) {
            //ready to add sub topics to new topic
            g = 1;
            this.open_group = 2;
            b = true;
        } else if (this.group_selected) {
            g = 2; // add it to the sub options
        } else {
            g = this.assign_group_number();
        }
        option.sign = 'plus';
        let item = { option: option, group_number: g };
        if (this.settings.start_open && this.selected_options.length == 0 && !b)
            this.open_group = 1;
        this.selected_options.push(item);
        if (
            this.user.editing &&
            option.topic_kind == 1 &&
            this.selected_options.length == 1
        ) {
            this.group_selected = true;
            const sub_options = this.get_sub_options(option);
            for (const opt of sub_options) {
                item = { option: opt, group_number: 2 };
                this.selected_options.push(item);
            }
        }
        const arr = this.selected_options.map((item) => item.option.name);
        this.selected_options_set = new Set(arr);
        //this.selected_options_set.add(option.name); changes are not detected
        this.sort_items();
        const div = this.scroll_area;
        setTimeout(() => {
            div.scrollTop = div.scrollHeight; // - div.clientHeight + 150
        }, 10);
    }

    get_sub_options(option) {
        const idx = option.id;
        const itm = this.option_groups.find((opt) => opt[0] == idx);
        const sub_option_indexes = itm[1];
        const result = [];
        for (const i of sub_option_indexes) {
            const opt = this.options.find((op) => op.id == i);
            result.push(opt);
        }
        return result;
    }

    enter_word(event) {
        const option = this.options.find(
            (opt) => opt.name == event.detail.value
        );
        if (!option) return;
        if (this.selected_options_set.has(option.name)) return;
        //if option was entered automatically from search box, it is not in the set, so:
        if (
            this.selected_options.find(
                (item) => item.option.name == option.name
            )
        )
            return;
        if (option && option.name.length > 2 && this.settings.auto_select) {
            this.select_option(option);
        }
    }

    unselect_item(item, index) {
        if (this.group_selected && item.option.topic_kind == 1) {
            //removing the top clears all selected
            this.group_selected = false;
            this.selected_options = [];
            this.selected_options_set = new Set();
        } else {
            this.selected_options.splice(index, 1);
            const arr = this.selected_options.map((item) => item.option.name);
            this.selected_options_set = new Set(arr);
        }
        this.sort_items();
        //this.selected_options_set.delete(item.option.name); like the above
    }

    clear_all_selections() {
        this.group_selected = false;
        this.selected_options = [];
        this.selected_options_set = new Set();
        this.sort_items();
    }

    get clear_selections() {
        if (!this.clear_selections_now) return false;
        this.clear_all_selections();
        this.clear_selections_now = false;
        return false;
    }

    toggle_group(group_number) {
        if (group_number == this.open_group) {
            this.open_group = 0;
        } else {
            this.open_group = group_number;
        }
        this.sort_items();
    }

    toggle_sign(option, event) {
        option.sign = option.sign == 'plus' ? 'minus' : 'plus';
        this.dispatch_event();
    }

    remove_option(option) {
        const customEvent = new CustomEvent('remove-option', {
            detail: {
                option: option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    edit_option(item, event) {
        item.editing = !item.editing;
    }

    name_changed(option) {
        const customEvent = new CustomEvent('name-changed', {
            detail: {
                option: option,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
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
        return false;
    }

    handle_new_item(event) {
        this.dispatch_new_item_event(event.detail.string_value);
    }

    move_item(item) {
        if (this.open_group == item.group_number) {
            // remove item from the open group
            item.group_number = this.find_free_group_number();
        } else if (this.open_group) {
            //
            item.group_number = this.open_group;
        } // else do nothing?
        this.sort_items();
    }

    find_free_group_number() {
        if (this.selected_options.length == 0) return 1;
        return (
            this.selected_options[this.selected_options.length - 1]
                .group_number + 1
        );
    }

    assign_group_number() {
        if (this.open_group) {
            return this.open_group;
        } else {
            return this.find_free_group_number();
        }
    }

    sort_items() {
        this.selected_options = this.selected_options.sort(
            (item1, item2) => item1.group_number - item2.group_number
        );
        for (const item of this.selected_options) item.last = false;
        const n = this.selected_options.length;
        if (n == 0) {
            this.dispatch_event();
            this.open_group = 0;
            return;
        }
        let i = 0;
        let g = 0;
        let has_groups = false;
        let prev_item = null;
        for (const item of this.selected_options) {
            if (item.group_number != g) {
                g = item.group_number;
                i += 1;
                item.first = true;
                if (prev_item) {
                    prev_item.last = true;
                }
            } else {
                item.first = false;
                has_groups = true;
            }
            prev_item = item;
            if (this.open_group == item.group_number) {
                this.open_group = i;
            }
            item.group_number = i;
        }
        this.selected_options[n - 1].last = true;
        this.calc_moveable(i);
        this.dispatch_event();
        this.has_groups = has_groups;
    }

    calc_moveable(i) {
        for (const item of this.selected_options) {
            item.moveable = i > 0 && this.can_move_item(item);
        }
    }

    get option_list_height() {
        if (this.filter || !this.settings.show_only_if_filter) {
            return this.settings.height_unselected;
        }
        return 0;
    }

    get total_size() {
        let h = this.selected_options_set.size * this.lineHeight;
        if (this.filter || !this.settings.show_only_if_filter) {
            h += this.settings.height_unselected;
        }
        return h;
    }

    get hide_higher() {
        return this.settings.hide_higher_options;
    }

    can_move_item(item) {
        if (!this.settings.can_group) return false;
        if (this.selected_options.length < 2) return false;
        if (!this.open_group) return false;
        if (item.group_number == this.open_group && item.first && item.last)
            return false;
        return true;
    }

    dispatch_event() {
        const changeEvent = new CustomEvent('ms-change', {
            detail: {
                selected_options: this.selected_options,
                show_untagged: this.to_show_untagged,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    show_untagged() {
        //clear all selected options
        this.to_show_untagged = !this.to_show_untagged;
        this.calc_untagged_caption();
        if (this.to_show_untagged) this.clear_all_selections();
        this.dispatch_event();
    }

    calc_untagged_caption() {
        const show_untagged_caption = this.to_show_untagged
            ? 'show-tagged-and-untagged'
            : 'show-untagged';
        this.show_untagged_caption = this.i18n.tr(
            'multi-select.' + show_untagged_caption
        );
    }

    get can_merge() {
        return this.settings.mergeable;
    }

    get can_edit_name() {
        return this.settings.name_editable;
    }

    get can_set_sign() {
        return this.settings.can_set_sign;
    }

    get can_add() {
        const filter_selected = this.selected_options.find(
            (opt) => opt.option.name == this.filter
        );
        return (
            this.settings.can_add &&
            this.filter_size == 0 &&
            this.filter &&
            !filter_selected
        );
    }

    get can_delete() {
        return this.settings.can_delete;
    }

    get can_show_untagged() {
        return this.settings.show_untagged;
    }

    get filter_size() {
        return this.agent.size;
    }

    get refresh() {
        const arr = this.selected_options.map((opt) => opt.option.name);
        this.selected_options_set = new Set(arr);
        return false;
    }

    is_visible(option) {
        if (option.topic_kind == undefined) return true;
        if (option.topic_kind == 2) return true;
        if (option.topic_kind == 0 && this.user.editing) return true;
        if (option.topic_kind == 1 && !this.hide_higher) return true;
        return false;
    }

    edit_option_dialog(option, event) {
        event.stopPropagation();
        if (!this.category) return false;
        if (!this.user.privileges.ADMIN) return false;
        if (!this.user.editing && this.category != 'locale') return false;
        this.dialog
            .open({
                viewModel: EditTopic,
                model: {
                    topic: option,
                    can_delete: this.can_delete,
                    category: this.category,
                },
                lock: true,
            })
            .whenClosed((result) => {
                if (result.wasCancelled) return;
                if (result.output.command == 'remove-topic') {
                    this.remove_option(option);
                } else if (result.output.command == 'rename') {
                    this.name_changed(option);
                }
            });
    }

    on_off_button_margin(first) {
        if (first || !this.user.advanced) return 0;
        return this.settings.can_set_sign
            ? 40
            : this.settings.can_group
            ? 20
            : 0;
    }

    option_class(first, last) {
        if (first) {
            if (last) return 'opt-single';
            return 'opt-top';
        } else if (last) {
            return 'opt-bottom';
        }
        return '';
    }
}

function clean(obj) {
    for (const propName in obj) {
        if (obj[propName] === null || obj[propName] === undefined) {
            delete obj[propName];
        }
    }
}
