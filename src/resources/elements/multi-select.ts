import { bindable, inject, DOM, bindingMode, computedFrom } from 'aurelia-framework';
import { set_intersection, set_union, set_diff } from '../../services/set_utils';
import { CustomDialog } from '../../services/custom-dialog';
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
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    all_options;
    //selections
    all_selected = new Set([]);
    grouped_selected = new Collections.Dictionary<string, Set<string>>(); //for each leading term it will have a set of itself and its peers
    ungrouped_selected: Set<string> = new Set([]);
    selected_options_storage = new Collections.Dictionary();  //stores option record by option name, used to map the name sets to lists of options
    //@bindable grouped_selected_options = [];  //this and the next are computed from the sets above
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) grouped_selected_options = [];  //this and the next are computed from the sets above
    @bindable ({ defaultBindingMode: bindingMode.twoWay }) ungrouped_selected_options = [];

    @bindable ({ defaultBindingMode: bindingMode.twoWay }) name;
    element;
    filter = "";
    @bindable place_holder_text = "";
    width;
    inner_width;
    @bindable height: 180;
    @bindable height_selected = 60;
    @bindable height_unselected = 120;
    @bindable settings = default_multi_select_options;
    @bindable can_edit = true;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) keywords = [];
    anchor = '<button class="btn btn-success"><i class="fa fa-lg fa-plus-square-o"></i></button>';
    new_item_name;
    lineHeight = 20;
    why_clip = "Merge all unmerged tags";
    why_unclip = "Unmerge this tag group";
    dialogService;
    new_item_placeholder;
    new_item_title;

    constructor(element, i18n: I18N, dialogService: DialogService) {
        this.element = element;
        this.dialogService = dialogService;
        this.why_clip = i18n.tr('multi-select.why-clip');
        this.why_unclip = i18n.tr('multi-select.why-unclip');
        this.new_item_placeholder = i18n.tr('multi-select.new-item-placeholder');
        this.new_item_title = i18n.tr('multi-select.new-item-title')
    }

    toggle_selection(option) {
        if (this.ungrouped_selected.has(option.name)) {
            this.ungrouped_selected.delete(option.name);
            this.all_selected.delete(option.name);
            this.selected_options_storage.remove(option.name);
        } else if (this.grouped_selected.containsKey(option.name)) {
            //remove the whole group
            let set = this.grouped_selected.getValue(option.name);
            let arr = Array.from(set);
            for (let opt_name of arr) {
                this.selected_options_storage.remove(opt_name);
                this.all_selected.delete(opt_name);
            }
            this.all_selected = set_diff(this.all_selected, set);
            this.grouped_selected.remove(option.name);
        } else {
            option.sign = 'plus';
            this.ungrouped_selected.add(option.name);
            this.selected_options_storage.setValue(option.name, option);
            this.all_selected.add(option.name);
        }
        /*if (!this.all_options) {
            this.all_options = this.options.splice(0);  //save the full list of options
        }
        this.options = this.all_options.filter(option => !this.all_selected.has(option.name));*/  //options becomes unselected options
        this.calculate_selected_lists();
        if (this.settings.clear_filter_after_select) {
            this.filter = "x"
            this.filter = this.filter.slice(0, -1);
        } else {
            this.filter = this.filter + " " //desperate attempt to force the set filter to be invoked
            this.filter = this.filter.slice(0, -1);
        }
        this.calc_keywords();
    }

    calc_keywords() {
        this.keywords = this.selected_options_storage.keys();
    }

    private option_set_to_option_list(option_set: Set<string>) {
        if (!option_set) {
            return [];
        }
        let arr: Array<string> = Array.from(option_set);
        let result = [];
        for (let opt of arr) {
            result.push(this.selected_options_storage.getValue(opt));
        }
        return result;
    }

    dispatch_event() {
        let grouped_options = this.grouped_selected_options.map(repr_opt => this.option_set_to_option_list(this.grouped_selected.getValue(repr_opt.name)));
        let changeEvent = new CustomEvent('change', {
            detail: {
                ungrouped_selected_options: this.ungrouped_selected_options,
                grouped_selected_options: grouped_options
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

    attached() {
        //todo: verify state is synced with the bound variales
        console.log(this.name, " multi select attached. grouped_selected_options ", this.grouped_selected_options, " ungrouped: ", this.ungrouped_selected_options)
        const elementRect = this.element.getBoundingClientRect();
        this.width = Math.round(elementRect.width) - 20;
        this.inner_width = this.width - 70;
        if (!this.height) {
            this.height = 180;
        }
        //use the code in calc_lists to set the correct heights
        this.height_selected = this.lineHeight;
        this.height_unselected = this.height - this.height_selected;
        //sync option sets from option arrays which are bound
        this.ungrouped_selected = new Set(this.ungrouped_selected_options);
        this.grouped_selected = new Collections.Dictionary<string, Set<string>>();
        this.calculate_heights();
        //now build it from this.grouped_selected_options
    }

    private make_list(name_set) {
        let names = Array.from(name_set);
        let result = "<html dir='rtl'>";
        for (let name of names) {
            result += name + "<br>";
        }
        result += "</html>"
        return result
    }

    merge_options(option, event) {
        this.grouped_selected.setValue(option.name, this.ungrouped_selected);
        option.names = this.make_list(this.ungrouped_selected);
        this.ungrouped_selected = new Set();
        this.calculate_selected_lists();
        this.filter = "";
    }

    unmerge_options(option, event) {
        let opts: Set<string> = this.grouped_selected.getValue(option.name);
        this.ungrouped_selected = set_union(this.ungrouped_selected, opts);
        this.grouped_selected.remove(option.name);
        this.calculate_selected_lists();
    }

    toggle_sign(option, event) {
        option.sign = (option.sign == 'plus') ? 'minus' : 'plus';
    }

    remove_option(option, event) {
        console.log("remove option not ready", option);
    }

    edit_option(option, event) {
        console.log("edit option not ready", option);
    }

    calculate_selected_lists() {
        this.grouped_selected_options = [];
        let storage = this.selected_options_storage;
        let gso = this.grouped_selected_options;
        console.log("in multi, gs: ", this.grouped_selected);
        this.grouped_selected.forEach(function (name, set) {
            let option = storage.getValue(name);
            console.log("in multi, name, set, option: ", name, set, option);
            gso.push(option);
        });
        console.log("in multi, grouped options: ", this.grouped_selected_options);
        let ungrouped = Array.from(this.ungrouped_selected);
        this.ungrouped_selected_options = ungrouped.map(u => this.selected_options_storage.getValue(u));
        this.calculate_heights();
        /*let selected_lines = Math.max(1, this.grouped_selected_options.length + this.ungrouped_selected_options.length);

        this.height_selected = Math.min(selected_lines * this.lineHeight, this.height - 3 * this.lineHeight) + 16;
        this.height_unselected = this.height - this.height_selected;*/

        this.dispatch_event();
    }

    calculate_heights() {
        let selected_lines = Math.max(1, this.grouped_selected_options.length + this.ungrouped_selected_options.length);
        this.height_selected = Math.min(selected_lines * this.lineHeight, this.height - 3 * this.lineHeight) + 16;
        this.height_unselected = this.height - this.height_selected;
    }

    onfocus(what) {
        alert(what)
    }

}

function extend(obj, src) {
    for (var key in src) {
        if (src.hasOwnProperty(key)) obj[key] = src[key];
    }
    return obj;
}