import { DialogController } from 'aurelia-dialog';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";

let THIS_EDITOR;

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
    story_text;
    dont_save = false;
    raw: false;
    dirty;
    froala_config = {
        iconsTemplate: 'font_awesome_5',
        toolbarButtons: ['undo', 'redo', '|', 'bold', 'italic', 'underline', '|', 'insertLink', 'insertImage', 'insertVideo', '|',
                'color', 'fontSize', 'align', 'html'],
        fontSize: ['8', '10', '12', '13', '14', '15', '16', '18', '20', '24', '32', '36', '48', '60', '72', '96'],
        imageDefaultDisplay: 'inline',
        imageDefaultAlign: 'right',
        imageUpload: false,
        imageDefaultWidth: 100,
        videoDefaultDisplay: 'inline',
        videoDefaultAlign: 'left',
        VideoDefaultWidth: 160,
        charCounterCount: false,
        linkAlwaysBlank: true,
        language: 'he', heightMin: 400, heightMax: 400,
        imageUploadRemoteUrls: false,
        key: ""
    };

    constructor(dialogController: DialogController, api: MemberGateway, user: User, theme: Theme) {
        this.dialogController = dialogController;
        this.api = api;
        this.user = user;
        this.theme = theme;
        THIS_EDITOR = this;
    }

    activate(model) {
        this.story = model.story;
        this.dont_save = model.dont_save;
        this.raw = model.raw
        if (!this.story) return;
        this.story_text = this.story.editable_preview ? this.story.preview : this.story.story_text
        if (! this.story_text) {
             this.story_text = "";
        }
        if (! this.story.source) {
            this.story.source = this.user.user_name;
        }
        this.story_orig = this.story_text.slice();
        this.story_name_orig = this.story.name.slice();
        this.story_source_orig = this.story.source.slice();
        this.edit = model.edit;
        this.show = !model.edit;
        this.froala_config.key = this.theme.froala_key();
        this.froala_config.language = this.story.language;
    }

    initialized(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        THIS_EDITOR.edited_str_orig = el.innerHTML.slice(0);
    }

    content_changed(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        let s = el.innerHTML;
        THIS_EDITOR.dirty = (s != THIS_EDITOR.edited_str_orig);
    }

    @computedFrom('story_text', 'story.name', 'story.source', 'dirty')
    get dirty_story() {
        let dirty = this.dirty || (this.story.name != this.story_name_orig) || (this.story.source != this.story_source_orig);
        return dirty;
    }

    save() {
        if (! this.dirty_story) {
            return;
        }
        let data = { user_id: this.user.id };
        if (this.story.editable_preview) {
            this.story.preview = this.story_text
        } else {
            this.story.story_text = this.story_text;
        }
        if (this.dont_save) {
            this.dialogController.ok({edited_text: this.story.story_text});
            return;
        };
        data['story_info'] = this.story;
        this.api.call_server_post('members/save_story_info', data)
            .then(response => {
                this.story_orig = this.story_text;
                this.story.timestamp = response.info.creation_date;
                this.story.author = response.info.author;
                this.dialogController.ok(response.info);
                this.story.story_id = response.info.story_id;
                this.story.preview = response.info.preview;
                this.story.name = response.info.name;
            });
    }

    cancel() {
        this.story_text = this.story_orig;
        this.dialogController.cancel();
    }

    clean() {
        this.api.call_server_post('members/clean_html_format', {html: this.story_text})
            .then(response => {
                this.story_text = response.html;
            });

    }

    beforeUpdate(images) {
        console.log("before update. images: ", images, " this: ", this);
    }

    @computedFrom('story', 'story.language')
    get story_dir() {
        if (! this.story) return "";
        if (this.story.language == 'he' || this.story.language == 'ar') {
            return "rtl"
        }
        return "ltr"
    }

}
