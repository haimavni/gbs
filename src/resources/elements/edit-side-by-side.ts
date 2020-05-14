import { autoinject, computedFrom, bindable, bindingMode } from 'aurelia-framework';
import { Theme } from '../../services/theme';
import { Misc } from '../../services/misc';

let THIS_EDITOR;

@autoinject
export class EditSideBySideCustomElement {
    @bindable fixed_str;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) edited_str;
    @bindable height = 500;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) init = false;
    theme: Theme;
    misc;
    edited_str_orig = null;
    //check_dirty = 0;
    dirty = false;

    constructor(theme: Theme, misc: Misc) {
        this.theme = theme;
        this.misc = misc;
        THIS_EDITOR = this;
    }
    // @computedFrom('theme.height')
    // get height() {
    //     return Math.round(this.theme.height * 5 / 8);
    // }

    attached() {
        console.log("attached. edited_str: ", this.edited_str)
        this.edited_str_orig = null;
    }

    // @computedFrom('edited_str', 'check_dirty')
    // get dirty() {
    //     console.log("in dirty: ", this.edited_str != this.edited_str_orig);
    //     if (this.edited_str_orig === null) {
    //         this.edited_str_orig = this.edited_str.slice(0);
    //         console.log(" this.edited_str_orig: ",  this.edited_str_orig);
    //         return false;
    //     }
    //     console.log("edited_str: ", this.edited_str);
    //     console.log("edited_str_orig: ", this.edited_str_orig);
    //     return this.edited_str != this.edited_str_orig;
    // }

    content_changed(e, editor) {
        THIS_EDITOR.check_dirty += 1;
        let el: Element = document.getElementsByClassName("fr-wrapper")[0].lastChild;
        let s = el.innerHTML;
        if (!THIS_EDITOR.edited_str_orig) {
            THIS_EDITOR.edited_str_orig = THIS_EDITOR.edited_str.slice(0);
            THIS_EDITOR.dirty = true;
        } else {
            THIS_EDITOR.dirty = s != THIS_EDITOR.edited_str_orig;
        }

    }

    cancel_changes() {
        this.edited_str = this.edited_str_orig.slice(0);
        this.dirty = false;
        //this.check_dirty = 0;
    }

    save_changes(event) {
        this.dirty = false;
        event.stopPropagation();
        this.dispatch_event('save');
    }

    dispatch_event(what) {
        let event = new CustomEvent(what, {
            bubbles: true
        });
        let element = document.getElementById("my-editor")
        element.dispatchEvent(event);
    }

    @computedFrom('init')
    get new_text() {
        this.init = false;
        console.log("new text. edited_str: ", this.edited_str);
        this.edited_str_orig = null;
        this.dirty = false;
        return 'bla';
    }

}


