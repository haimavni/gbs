import { IUser } from "../../services/user";
import { IMemberGateway } from "../../services/gateway";
import { ITheme } from "../../services/theme";
import { StoryWindow } from "../../stories/story_window";
import { IDialogService } from "@aurelia/dialog";
import { IMisc } from "../../services/misc";
import { I18N } from "@aurelia/i18n";
import { BindingMode, IEventAggregator, INode, bindable } from "aurelia";

export class LetterCustomElement {
    @bindable topic;
    @bindable editing_template;
    @bindable params = {};
    @bindable edit_template_button_text = "groups.edit-letter-template";
    @bindable view_letter_button_text = "groups.view-letter";
    @bindable edit_letter_button_text = "groups.edit-letter";
    @bindable send_letter_button_text = "groups.send-letter";
    @bindable({ mode: BindingMode.twoWay }) mail_body = "";
    letter_template = "";
    story_info;
    sending_enabled = false;
    mail_sent = false;
    need_to_show;

    constructor(
        @INode private readonly element: HTMLElement,
        @IUser private readonly user: IUser,
        @IMemberGateway private readonly api: IMemberGateway,
        @IDialogService private readonly dialog: IDialogService,
        @IEventAggregator private readonly eventAggregator: IEventAggregator,
        @ITheme private readonly theme: ITheme,
        @IMisc private readonly misc: IMisc,
        @I18N private readonly i18n: I18N
    ) {
        this.need_to_show = this.i18n.tr("groups.need-to-show");
    }

    attached() {
        this.load_letter_template();
        if (!this.editing_template) this.apply_params();
    }

    load_letter_template() {
        return this.api
            .call_server("letters/get_letter", { topic: this.topic })
            .then((response) => {
                this.story_info = response.story_info;
                this.letter_template = this.story_info.story_text;
            });
    }

    apply_params() {
        this.mail_body = this.misc.extrapolate(
            this.letter_template,
            this.params
        );
    }

    edit_letter_template(event) {
        event.stopPropagation();
        this.load_letter_template().then((response) => {
            this.theme.hide_title = true;
            this.dialog
                .open({
                    component: () => StoryWindow,
                    model: {
                        story: this.story_info,
                        edit: true,
                        dont_save: false,
                        raw: true,
                    },
                    lock: true,
                })
                .whenClosed((response) => {
                    this.mail_body = "";
                    this.theme.hide_title = false;
                });
        });
    }

    edit_or_view(event, edit) {
        event.stopPropagation();
        if (!this.mail_body) this.apply_params();
        if (!this.theme.is_desktop) return;
        this.theme.hide_title = true;
        this.story_info.story_text = this.mail_body;
        this.dialog
            .open({
                component: () => StoryWindow,
                model: {
                    story: this.story_info,
                    edit: edit,
                    dont_save: true,
                    raw: true,
                },
                lock: edit,
            })
            .whenClosed((response) => {
                if ((response.value as any).edited_text) {
                    this.mail_body = (response.value as any).edited_text;
                }
                this.theme.hide_title = false;
            });
    }

    edit_letter(event) {
        this.edit_or_view(event, true);
    }

    view_letter(event) {
        this.edit_or_view(event, false);
    }

    send_letter(event) {
        event.stopPropagation();
        if (!this.mail_body) return;
        this.dispatch_event("send");
    }

    dispatch_event(what) {
        let event = new CustomEvent(what, {
            bubbles: true,
        });
        this.element.dispatchEvent(event);
        this.mail_sent = true;
    }
}
