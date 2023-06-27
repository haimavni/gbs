import { IDialogController } from "@aurelia/dialog";
import { ITheme } from "../services/theme";

export class SelectSearch {
    constructor(
        @IDialogController private readonly controller: IDialogController,
        @ITheme theme: ITheme
    ) {}

    public go_search_members() {
        this.controller.ok();
    }

    public go_search_stories() {
        this.controller.cancel();
    }
}
