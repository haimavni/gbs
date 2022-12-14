import { bindable } from 'aurelia';
import { ITheme } from '../../services/theme';

export class InfoCustomElement {
    @bindable title;
    @bindable content;
    @bindable icon = 'info-circle';

    constructor(@ITheme readonly theme: ITheme) {}
}
