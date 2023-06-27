import { autoinject } from "aurelia-framework";
import { DialogController } from "aurelia-dialog";
import { Theme } from "../services/theme";

@autoinject
export class SelectSearch {
    controller: DialogController;
    theme: Theme;

    constructor(
        controller: DialogController, theme: Theme
    ) {
        this.controller = controller;
        this.theme = theme;
    }

    public go_search_members() {
        this.controller.ok();
    }

    public go_search_stories() {
        this.controller.cancel();
    }
}
