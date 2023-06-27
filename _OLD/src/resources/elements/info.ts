import { bindable, autoinject } from 'aurelia-framework';
import { Theme } from '../../services/theme';

@autoinject()
export class InfoCustomElement {
    @bindable title;
    @bindable content;
    @bindable icon = 'info-circle';
    theme;

    constructor(theme: Theme) {
        this.theme = theme;
    }

}
