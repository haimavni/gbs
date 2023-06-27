import { ITheme } from "../../services/theme";
import { IMisc } from "../../services/misc";
import { BindingMode, bindable } from "aurelia";

let THIS_EDITOR;

export class EditSideBySideCustomElement {
    @bindable fixed_str;
    @bindable({ mode: BindingMode.twoWay }) edited_str;
    @bindable height = 520;
    @bindable({ mode: BindingMode.twoWay }) init = false;
    @bindable({ mode: BindingMode.twoWay }) dirty = false;
    edited_str_orig = null;
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
        imageDefaultWidth: 100,
        videoDefaultDisplay: "inline",
        videoDefaultAlign: "left",
        VideoDefaultWidth: 160,
        charCounterCount: false,
        linkAlwaysBlank: true,
        htmlUntouched: true,
        language: "he",
        heightMin: this.height,
        heightMax: this.height,
        imageUploadRemoteUrls: false,
        key: "",
    };

    constructor(
        @ITheme private readonly theme: ITheme,
        @IMisc private readonly misc: IMisc
    ) {
        THIS_EDITOR = this;
    }

    activate() {
        this.froala_config = {
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
            imageDefaultWidth: 100,
            videoDefaultDisplay: "inline",
            videoDefaultAlign: "left",
            VideoDefaultWidth: 160,
            charCounterCount: false,
            linkAlwaysBlank: true,
            htmlUntouched: true,
            language: "he",
            heightMin: this.height,
            heightMax: this.height,
            imageUploadRemoteUrls: false,
            key: "",
        };
        this.froala_config.key = this.theme.froala_key();
        this.froala_config.heightMin = this.height;
        this.froala_config.heightMax = this.height;
    }

    initialized(e, editor) {
        // let el: any = document.getElementsByClassName("fr-element")[0];
        // THIS_EDITOR.story_orig = el.innerHTML.slice(0);
    }

    focus(e, editor) {
        if (THIS_EDITOR.init) {
            let el: any = document.getElementsByClassName("fr-element")[0];
            let s = el.innerHTML;
            THIS_EDITOR.edited_str_orig = s.slice(0);
            THIS_EDITOR.init = false;
            THIS_EDITOR.dirty = false;
            editor.undo.reset();
        }
    }

    content_changed(e, editor) {
        let el: any = document.getElementsByClassName("fr-element")[0];
        let s = el.innerHTML;

        THIS_EDITOR.dirty = s != THIS_EDITOR.edited_str_orig;
    }

    cancel_changes() {
        this.edited_str = this.edited_str_orig.slice(0);
        this.dirty = false;
    }

    save_changes(event) {
        this.dirty = false;
        event.stopPropagation();
        this.dispatch_event("save");
    }

    approve_changes(event) {
        this.dirty = false;
        event.stopPropagation();
        this.dispatch_event("approve");
    }

    skip_story(event) {
        this.dirty = false;
        event.stopPropagation();
        this.dispatch_event("skip");
    }

    dispatch_event(what) {
        let event = new CustomEvent(what, {
            bubbles: true,
        });
        let element = document.getElementById("my-editor");
        element.dispatchEvent(event);
    }
}
