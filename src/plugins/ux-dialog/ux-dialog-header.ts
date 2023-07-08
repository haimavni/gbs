import { IDialogController } from "@aurelia/dialog";
import { bindable, customElement } from "aurelia";

@customElement({
    name: "ux-dialog-header",
    template: `  <button
    type="button"
    class="dialog-close"
    aria-label="Close"
    if.bind="showCloseButton"
    click.trigger="controller.cancel()">
    <span aria-hidden="true">&times;</span>
  </button>

  <div class="dialog-header-content">
    <au-slot></au-slot>
  </div>`,
})
export class UxDialogHeader {
    @bindable public showCloseButton: boolean | undefined;

    constructor(@IDialogController public controller: IDialogController) {}

    public bound(): void {
        if (typeof this.showCloseButton !== "boolean") {
            this.showCloseButton = !this.controller.settings.lock;
        }
    }
}
