import { IDialogController } from "@aurelia/dialog";
import { bindable, customElement } from "aurelia";

@customElement({
    name: "ux-dialog-footer",
    template: `  <au-slot></au-slot>
    <template if.bind="buttons.length > 0">
      <button type="button"
        class="btn btn-default"
        repeat.for="button of buttons"
        click.trigger="close(button)">
        \${button}
      </button>
    </template>`,
})
export class UxDialogFooter {
    @bindable public buttons: any[] = [];

    @bindable public useDefaultButtons: boolean = false;

    constructor(@IDialogController public controller: IDialogController) {}

    public static isCancelButton(value: string) {
        return value === "Cancel";
    }

    public close(buttonValue: string) {
        if (UxDialogFooter.isCancelButton(buttonValue)) {
            this.controller.cancel(buttonValue);
        } else {
            this.controller.ok(buttonValue);
        }
    }

    public useDefaultButtonsChanged(newValue: boolean) {
        if (newValue) {
            this.buttons = ["Cancel", "Ok"];
        }
    }
}
