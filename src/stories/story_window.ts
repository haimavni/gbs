export class StoryWindow {
    story;
    edit;
    show;

    activate(model) {
        console.debug("enter activate of story window");
        this.story = model.story;
        this.edit = model.edit;
        this.show = ! model.edit;
        console.log("edit dr4ek? ", this.edit, " show? ", this.show);
    }

}