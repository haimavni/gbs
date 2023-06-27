import { IDialogController } from '@aurelia/dialog';
import { ITheme } from "../services/theme";
import { ICookies } from "../services/cookies";

export class NotifyLowScreen {
    constructor(
        @IDialogController private readonly controller: IDialogController, 
        @ITheme private readonly theme: ITheme,
        @ICookies private readonly cookies: ICookies
    ) {

    }

    public got_it() {
        this.controller.ok();
    }

    public dont_show_again() {
        this.cookies.put('NO-SCREEN-ALERT', true);
        this.controller.cancel();
    }
}
