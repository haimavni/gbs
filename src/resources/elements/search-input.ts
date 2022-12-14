import { bindable, BindingMode, INode } from 'aurelia';
import { ITheme } from '../../services/theme';

export class SearchInputCustomElement {
    @bindable({ mode: BindingMode.twoWay }) value;
    @bindable placeholder = 'type something';
    @bindable height;
    @bindable help_topic = 'search-input';

    constructor(
        @INode readonly element: HTMLElement,
        @ITheme readonly theme: ITheme
    ) {}

    clear_text(event) {
        this.value = '';
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
        const changeEvent = new CustomEvent('filter-change', {
            detail: {
                value: this.value,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }
}
