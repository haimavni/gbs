export class StoryWindow {
    story;
    edit;

    activate(model) {
        console.debug("enter activate of story window");
        this.story = model.story;
        this.edit = model.edit;
    }

}