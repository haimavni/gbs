import {autoinject, bindable} from 'aurelia-framework';
import {I18N} from 'aurelia-i18n';

@autoinject
export class LocalePickerCustomElement {
 
  @bindable selectedLocale;
  @bindable locales = ['en', 'he'];
  i18n;
  isChangingLocale = false;

  constructor(i18n: I18N) {
    this.i18n = i18n;

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
