import { autoinject, computedFrom, bindable, bindingMode } from 'aurelia-framework';
import { Theme } from '../../services/theme';

@autoinject
export class EditSideBySideCustomElement {
    @bindable fixed_str;
    @bindable({ defaultBindingMode: bindingMode.twoWay }) edited_str;
    @bindable height = 500;
    theme: Theme;

    constructor(theme: Theme) {
        this.theme = theme;
    }
    // @computedFrom('theme.height')
    // get height() {
    //     return Math.round(this.theme.height * 5 / 8);
    // }
    
}
