import { bindable, inject, DOM, bindingMode } from 'aurelia-framework';
import { User } from '../../services/user';
import { set_intersection, set_union, set_diff } from '../../services/set_utils';
import * as Collections from 'typescript-collections';

@inject(DOM.Element, User)
export class MultiSelectCustomElement {
    private compare = (k1, k2) => k1.name < k2.name ? -1 : k1.name > k2.name ? 1 : 0;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) options = [];
    all_options;
    //selections
    all_selected = new Set([]);
    grouped_selected = new Collections.Dictionary<string, Set<string>>(); //for each leading term it will have a set of itself and its peers
    ungrouped_selected: Set<string> = new Set([]);
    selected_options_storage = new Collections.Dictionary();  //stores option record by option name, used to map the name sets to lists of options
    grouped_selected_options = [];  //this and the next are computed from the sets above
    ungrouped_selected_options = [];

    @bindable user;
    element;
    filter = "";
    @bindable place_holder_text = "";
    width;
    @bindable height: 180;
    @bindable height_selected = 60;
    @bindable height_unselected = 120;
    @bindable settings = { clear_filter_after_select: true };

    constructor(element, user) {
        this.element = element;
        this.user = user;
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
            this.ungrouped_selected.add(option.name);
            this.selected_options_storage.setValue(option.name, option);
            this.all_selected.add(option.name);
        }
        if (!this.all_options) {
            this.all_options = this.options.splice(0);  //save the full list of options
        }
        //this.ungrouped_selected_options = this.all_options.filter(option => this.selected.has(option.name));
        this.options = this.all_options.filter(option => !this.all_selected.has(option.name));  //options become unselected options
        this.calculate_selected_lists();
        if (this.settings.clear_filter_after_select) {
            this.filter = ""
        }
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('change', {
            detail: {
                ungrouped_selected_options: this.ungrouped_selected_options,
                grouped_selected_options: this.grouped_selected_options
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    attached() {
        /*let dict = new Collections.Dictionary();
        dict.setValue('boo', 999);
        let m = dict['boo'];
        console.log("m is ", m, " - ", dict.getValue('boo'));
        dict.setValue('koo', 888);
        console.log('dict: ', dict);
        dict.remove("boo");
        console.log('dict after deletion: ', dict);*/
        const elementRect = this.element.getBoundingClientRect();
        this.width = Math.round(elementRect.width) - 50;
        if (!this.height) {
            this.height = 180;
        }
        this.height_selected = Math.max(Math.round(this.height / 3), 40);
        this.height_unselected = this.height - this.height_selected;
        console.log("height, height_selected, height_unselected: ", this.height, this.height_selected, this.height_unselected);
    }

    merge_options(option, event) {
        console.log("merge ", option);
        this.grouped_selected[option.name] = this.ungrouped_selected;
        this.ungrouped_selected = new Set();
        this.calculate_selected_lists();
    }

    unmerge_options(option, event) {
        console.log("unmerge ", option);
        this.dispatch_event();
    }

    calculate_selected_lists() {
        this.grouped_selected_options = [];
        this.grouped_selected.forEach(function(name, set) {
            let arr = Array.from(set);
            let options = arr.map(name => this.selected_options_storage[name]);
            this.grouped_selected_options = this.grouped_selected_options.concat(options);
        });


        let ungrouped = Array.from(this.ungrouped_selected);
        this.ungrouped_selected_options = ungrouped.map(u => this.selected_options_storage.getValue(u));
        this.dispatch_event();
    }

    edit_option(option, event) {
        console.log("edit ", option);
    }

    onfocus(what) {
        alert(what)
    }

}

