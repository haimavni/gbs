import { bindable } from 'aurelia';
import { ITheme } from '../../services/theme';

export class InfoCustomElement {
    @bindable title;
    @bindable content;
    @bindable icon = 'info-circle';

    constructor(@ITheme private readonly theme: ITheme) {
        this.theme = theme;
    }

}
