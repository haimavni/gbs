import { DialogController } from 'aurelia-dialog';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { Misc } from "../services/misc";
import { getOffset } from '../services/dom_utils';

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
    theme: Theme;
    misc: Misc;
    story_name_orig;
    story_source_orig;
    story_text;
    dont_save = false;
    raw: false;
    dirty;
    images_hidden = false;
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
        htmlUntouched: true,
        linkAlwaysBlank: true,
        language: 'he', heightMin: 400, heightMax: 400,
        imageUploadRemoteUrls: false,
        key: "",
        events: {
            'initialized': function() {
                console.log("got the focus")
            }
        }
    };

    constructor(dialogController: DialogController, api: MemberGateway, user: User, theme: Theme, misc: Misc) {
        this.dialogController = dialogController;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.misc =  misc;
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
        if (! this.story.name) {
            this.story.name = "";
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
        this.images_hidden = this.hide_images()
    }

    hide_images() {
        //work around froala bug where images have a caption
        if (! this.story_text.search('fr-inner'))
            return false;
        this.story_text = this.story_text.replace('\n', '');
        let pat_str = '(<span class="fr-img-caption(.*?)>)([^>]*?>)([^>]*?>)'; //<img .*?>)';
        let pat = new RegExp(pat_str, 'gi');
        this.story_text = this.story_text.replace(pat, 
            function(m, m1, m2, m3, m4) {
                const m40 = m4.replace('<', '<!--').replace('>', '-->');
                return `${m1}${m3}${m40}`
            });
        //this.restore_images(); images show but we get exceptions
        return true;

    }

    async restore_images() {
        //await this.misc.sleep(1000);
        let pat_str = '<!--img (.*?)-->';
        let pat = new RegExp(pat_str, 'gi');
        this.story_text = this.story_text.replace(pat, function(m, m1) {
            return `<img ${m1}>`
        })
    }

    initialized(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        let innerHTML = el.innerHTML || "";
        THIS_EDITOR.edited_str_orig = innerHTML.slice(0);
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
        if (this.images_hidden)
            this.restore_images()
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

    move_editor(customEvent) {
        console.log("entered move editor")
        let event = customEvent.detail;
        let dx = event.dx;
        let dy = event.dy;
        this.move_box(dx, dy);
    }

    move_box(dx, dy) {
        const el: Element = document.getElementById("editor-top")
        const dv = el.parentElement.parentElement;
        const offset = getOffset(dv);
        let margin_left_str = dv.style.marginLeft ? dv.style.marginLeft.replace("px", "") : offset.left;
        let margin_left = parseFloat(margin_left_str);
        dv.style.marginLeft = (margin_left + dx) + "px";
        //vertical does not work. important! somewhere...
        let margin_top_str = dv.style.marginTop ? dv.style.marginTop.replace("px", "") : offset.top;
        let margin_top = parseFloat(margin_top_str);
        dv.style.marginTop = (margin_top + dy) + "px";
    }

}
