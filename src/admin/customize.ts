import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { DialogController } from 'aurelia-dialog';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';

@autoinject()
export class Customize {

    theme;
    app_title;
    router;
    i18n;
    controller;
    key_value_list = [];
    options_settings: MultiSelectSettings;

    constructor(theme: Theme, router: Router, i18n: I18N, controller: DialogController) {
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
        this.controller = controller;
        this.options_settings = new MultiSelectSettings({
            clear_filter_after_select: false,
            name_editable: true,
            can_set_sign: false,
            can_group: false,
        });
    }

    attached() {
        this.app_title = this.i18n.tr('app-title');
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        let lang = this.i18n.getLocale();
        let data = this.i18n.i18next.store.data[lang].translation;
        this.create_key_value_list('', data);
    }

    create_key_value_list(prefix, data) {
        let keys = Object.keys(data);
        for (let key of keys) {
            let v = data[key];
            let p = prefix ? prefix + '.' : ''
            if (typeof v == 'string') {
                let itm = { id: p + key, name: v }
                this.key_value_list.push(itm)
            } else {
                this.create_key_value_list(p + key, v)
            }
        }
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        this.key_value_list = [];
    }

    activate() {
        this.app_title = this.i18n.tr('app-title');
    }

    save() {
        this.theme.set_locale_override('app-title', this.app_title);
        this.controller.ok();
    }

    save_app_title() {
        this.theme.set_locale_override('app-title', this.app_title);
    }

    cancel() {
        this.controller.cancel();
    }

    dic_item_changed(event) {
        let p = event.detail.option;
        console.log("p is ", p);
        this.theme.set_locale_override(p.id, p.name);
    }


}
