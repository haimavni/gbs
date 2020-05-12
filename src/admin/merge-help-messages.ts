import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { DialogController } from 'aurelia-dialog';
import { MultiSelectSettings } from '../resources/elements/multi-select/multi-select';
import { MemberGateway } from '../services/gateway';
import { User } from '../services/user';

@autoinject
export class MergeHelpMessages {
    left_text = "bla bla bla";
    right_text = "boom boom boom";
    theme: Theme;

    constructor(theme: Theme) {
        this.theme = theme;
    }

    attached() {
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

}
