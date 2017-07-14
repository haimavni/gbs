import { DialogController } from 'aurelia-dialog';
import {autoinject} from 'aurelia-framework';

@autoinject
export class StoryWindow {
    story;
    edit;
    show;
    dialogController: DialogController;

    constructor(dialogController: DialogController) {
        this.dialogController = dialogController;
    }

    activate(model) {
        console.debug("enter activate of story window");
        this.story = model.story;
        this.edit = model.edit;
        this.show = ! model.edit;
        console.log("edit dr4ek? ", this.edit, " show? ", this.show);
    }

    save() {
        this.dialogController.ok("saved");
    }

    cancel() {
        this.dialogController.cancel();
    }

}