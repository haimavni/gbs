import { DialogController } from 'aurelia-dialog';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";

@autoinject
export class StoryWindow {
    story;
    story_orig;
    edit;
    show;
    dialogController: DialogController;
    api: MemberGateway;
    user: User;
    theme;
    story_name_orig;
    story_source_orig;

    constructor(dialogController: DialogController, api: MemberGateway, user: User, theme: Theme) {
        this.dialogController = dialogController;
        this.api = api;
        this.user = user;
        this.theme = theme;
    }

    activate(model) {
        console.debug("enter activate of story window");
        this.story = model.story;
        if (! this.story.story_text) {
             this.story.story_text = "";
        }
        if (! this.story.source) {
            this.story.source = this.user.user_name;
        }
        this.story_orig = this.story.story_text.slice();
        this.story_name_orig = this.story.name.slice();
        this.story_source_orig = this.story.source.slice();
        this.edit = model.edit;
        this.show = !model.edit;
    }

    @computedFrom('story.story_text', 'story.name', 'story.source')
    get dirty_story() {
        let dirty = (this.story.story_text != this.story_orig) || (this.story.name != this.story_name_orig) || (this.story.source != this.story_source_orig);
        return dirty;
    }

    save() {
        if (! this.dirty_story) {
            return;
        }
        let data = { user_id: this.user.id };
        data['story_info'] = this.story;
        this.api.call_server_post('members/save_story_info', data)
            .then(response => {
                this.story_orig = this.story.story_text;
                this.story.timestamp = response.info.creation_date;
                this.story.author = response.info.author;
                this.dialogController.ok(response.info);
                this.story.story_id = response.info.story_id;
                this.story.story_preview = response.info.story_preview;
            });
    }

    cancel() {
        this.story.story_text = this.story_orig;
        this.dialogController.cancel();
    }

    clean() {
        this.api.call_server_post('members/clean_html_format', {html: this.story.story_text})
            .then(response => this.story.story_text = response.html);
    }

}
