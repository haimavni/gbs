import { ICustomElementViewModel } from 'aurelia';
/* eslint-disable @typescript-eslint/no-this-alias */
import { DI, IDialogController } from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";

let THIS_EDITOR;

export const IStoryWindow = DI.createInterface<IStoryWindow>('IStoryWindow', x => x.singleton(StoryWindow));
export type IStoryWindow = StoryWindow;

export class StoryWindow implements ICustomElementViewModel {
    story;
    story_orig;
    edit;
    show;
    story_name_orig;
    story_source_orig;
    story_text;
    dont_save = false;
    raw: false;
    dirty;
    images_hidden = false;
    froala_config = {
        iconsTemplate: "font_awesome_5",
        toolbarButtons: [
            "undo",
            "redo",
            "|",
            "bold",
            "italic",
            "underline",
            "|",
            "insertLink",
            "insertImage",
            "insertVideo",
            "|",
            "color",
            "fontSize",
            "align",
            "html",
        ],
        fontSize: [
            "8",
            "10",
            "12",
            "13",
            "14",
            "15",
            "16",
            "18",
            "20",
            "24",
            "32",
            "36",
            "48",
            "60",
            "72",
            "96",
        ],
        imageDefaultDisplay: "inline",
        imageDefaultAlign: "right",
        imageUpload: false,
        imageDefaultWidth: 100,
        videoDefaultDisplay: "inline",
        videoDefaultAlign: "left",
        VideoDefaultWidth: 160,
        charCounterCount: false,
        linkAlwaysBlank: true,
        language: "he",
        heightMin: 400,
        heightMax: 400,
        imageUploadRemoteUrls: false,
        key: "",
    };

    constructor(
        @IDialogController readonly dialogController: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme
    ) {
        THIS_EDITOR = this;
    }

    activate(model) {
        this.story = model.story;
        this.dont_save = model.dont_save;
        this.raw = model.raw;
        if (!this.story) return;
        this.story_text = this.story.editable_preview
            ? this.story.preview
            : this.story.story_text;
        if (!this.story_text) {
            this.story_text = "";
        }
        if (!this.story.name) {
            this.story.name = "";
        }
        if (!this.story.source) {
            this.story.source = this.user.user_name;
        }
        this.story_orig = this.story_text.slice();
        this.story_name_orig = this.story.name.slice();
        this.story_source_orig = this.story.source.slice();
        this.edit = model.edit;
        this.show = !model.edit;
        this.froala_config.key = this.theme.froala_key();
        this.froala_config.language = this.story.language;
        this.images_hidden = this.hide_images();
    }

    hide_images() {
        if (!this.story_text.search("fr-inner")) return false;
        const pat_str = "<img (.*?)>";
        const pat = new RegExp(pat_str, "gi");
        this.story_text = this.story_text.replace(pat, function (m, m1) {
            return `<!--img ${m1}-->`;
        });
        return true;
    }

    restore_images() {
        const pat_str = "<!--img (.*?)-->";
        const pat = new RegExp(pat_str, "gi");
        this.story_text = this.story_text.replace(pat, function (m, m1) {
            return `<img ${m1}>`;
        });
    }

    initialized(e, editor) {
        const el: any = document.getElementsByClassName("fr-element")[0];
        const innerHTML = el.innerHTML || "";
        THIS_EDITOR.edited_str_orig = innerHTML.slice(0);
    }

    content_changed(e, editor) {
        const el: any = document.getElementsByClassName("fr-element")[0];
        const s = el.innerHTML;
        THIS_EDITOR.dirty = s != THIS_EDITOR.edited_str_orig;
    }

    get dirty_story() {
        const dirty =
            this.dirty ||
            this.story.name != this.story_name_orig ||
            this.story.source != this.story_source_orig;
        return dirty;
    }

    save() {
        if (this.images_hidden) this.restore_images();
        if (!this.dirty_story) {
            return;
        }
        const data = { user_id: this.user.id };
        if (this.story.editable_preview) {
            this.story.preview = this.story_text;
        } else {
            this.story.story_text = this.story_text;
        }
        if (this.dont_save) {
            this.dialogController.ok({ edited_text: this.story.story_text });
            return;
        }
        data["story_info"] = this.story;
        this.api
            .call_server_post("members/save_story_info", data)
            .then((response) => {
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
        this.api
            .call_server_post("members/clean_html_format", {
                html: this.story_text,
            })
            .then((response) => {
                this.story_text = response.html;
            });
    }

    beforeUpdate(images) {
        console.log("before update. images: ", images, " this: ", this);
    }

    get story_dir() {
        if (!this.story) return "";
        if (this.story.language == "he" || this.story.language == "ar") {
            return "rtl";
        }
        return "ltr";
    }
}
