import { bindable, ICustomElementViewModel } from 'aurelia';
import { I18N } from '@aurelia/i18n';

export class LocalePickerCustomElement implements ICustomElementViewModel {
    @bindable selectedLocale;
    @bindable locales = ['en', 'he'];
    isChangingLocale = false;

    constructor(@I18N readonly i18n: I18N) {
        this.selectedLocale = this.i18n.getLocale();
        this.isChangingLocale = false;
    }

    selectedLocaleChanged() {
        this.isChangingLocale = true;
        
        this.i18n.setLocale(this.selectedLocale).then(() => {
            this.isChangingLocale = false;
        });
    }
}
