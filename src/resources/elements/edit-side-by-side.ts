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
    @bindable({ defaultBindingMode: bindingMode.twoWay }) dirty = false;
    theme: Theme;
    misc;
    edited_str_orig = null;

    constructor(theme: Theme, misc: Misc) {
        this.theme = theme;
        this.misc = misc;
        THIS_EDITOR = this;
    }

    // initialized(e, editor) {
    //     let el: any = document.getElementsByClassName("fr-element")[0];
    //     THIS_EDITOR.story_orig = el.innerHTML.slice(0);
    // }

    focus(e, editor) {
        if (THIS_EDITOR.init) {
            let el: any = document.getElementsByClassName("fr-element")[0];
            let s = el.innerHTML;
            THIS_EDITOR.edited_str_orig = s.slice(0);
            THIS_EDITOR.init = false;
            THIS_EDITOR.dirty = false;
            editor.undo.reset();
        }
    }

    content_changed(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        let s = el.innerHTML;

        THIS_EDITOR.dirty = (s != THIS_EDITOR.edited_str_orig);
    }

    cancel_changes() {
        this.edited_str = this.edited_str_orig.slice(0);
        this.dirty = false;
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

}
