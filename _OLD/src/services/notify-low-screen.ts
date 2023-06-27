import { autoinject } from "aurelia-framework";
import { DialogController } from "aurelia-dialog";
import { Theme } from "../services/theme";
import {Cookies} from "../services/cookies";

@autoinject
export class NotifyLowScreen {
    controller: DialogController;
    theme: Theme;
    cookies: Cookies;

    constructor(
        controller: DialogController, 
        theme: Theme,
        cookies: Cookies
    ) {
        this.controller = controller;
        this.theme = theme;
        this.cookies = cookies;
    }

    public got_it() {
        this.controller.ok();
    }

    public dont_show_again() {
        this.cookies.put('NO-SCREEN-ALERT', true);
        this.controller.cancel();
    }
}
