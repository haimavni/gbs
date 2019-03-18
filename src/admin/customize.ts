import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';

@autoinject()
export class Customize {

    theme;
    app_title;
    router;
    i18n;

    constructor(theme: Theme, router: Router, i18n: I18N) {
        this.theme = theme;
        this.router = router;
        this.i18n = i18n;
    }

    attached() {
        this.app_title = this.i18n.tr('app-title');
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    activate() {
        this.app_title = this.i18n.tr('app-title');
    }

    set_app_title() {
        this.theme.set_locale_override('app-title', this.app_title)
    }
}
