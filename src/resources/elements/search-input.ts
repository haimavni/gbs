import { ITheme } from "../../services/theme";
import { IMisc } from "../../services/misc";
import { BindingMode, INode, bindable } from "aurelia";

export class SearchInputCustomElement {
    @bindable({ mode: BindingMode.twoWay }) value;
    @bindable placeholder = "type something";
    @bindable height;
    @bindable help_topic = "search-input";
    @bindable({ mode: BindingMode.twoWay }) in_focus = false;

    constructor(
        @INode private readonly element: HTMLElement,
        @ITheme private readonly theme: ITheme,
        @IMisc private readonly misc: IMisc
    ) {}

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
        let changeEvent = new CustomEvent("filter-change", {
            detail: {
                value: this.value,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(changeEvent);
    }

    async is_in_focus(b) {
        if (!b) await this.misc.sleep(1000);
        this.in_focus = b;
    }
}
