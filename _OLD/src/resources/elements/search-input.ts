import { bindable, bindingMode, inject, DOM } from 'aurelia-framework';
import {Theme} from '../../services/theme';
import {Misc} from '../../services/misc';

@inject(DOM.Element, Theme, Misc)
export class SearchInputCustomElement {
    @bindable({defaultBindingMode: bindingMode.twoWay}) value;
    @bindable placeholder = 'type something';
    @bindable height;
    @bindable help_topic = 'search-input';
    element;
    theme: Theme;
    misc: Misc;
    @bindable({defaultBindingMode: bindingMode.twoWay}) in_focus = false;

    constructor(element, theme, misc) {
        this.element = element;
        this.theme = theme;
        this.misc = misc;
    }

    clear_text(event) {
        this.value = "";
    }

    input_changed(event) {
        /*let key = event.key;
        if (key == "Enter") {
            this.dispatch_event();
        }*/
        this.dispatch_event();
        return true;
    }

    dispatch_event() {
        let changeEvent = new CustomEvent('filter-change', {
            detail: {
                value: this.value,
            },
            bubbles: true
        });
        this.element.dispatchEvent(changeEvent);
    }

    async is_in_focus(b) {
        if (! b) 
           await this.misc.sleep(1000);
        this.in_focus = b;
    }
    

}
