import { I18N } from "@aurelia/i18n";
import { ITheme } from "../services/theme";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";

export class MergeHelpMessages {
    left_text = "";
    right_text = "";
    filter = "";
    message_list = [];
    empty = false;
    curr_story_id = 0;
    init = false;
    dirty = false;
    explain_accept_system;

    constructor(
        @ITheme private readonly theme: ITheme,
        @I18N private readonly i18n: I18N,
        @IMemberGateway private readonly api: IMemberGateway,
        @IUser private readonly user: IUser
    ) {
        this.explain_accept_system = this.i18n.tr(
            "admin.explain-accept-system"
        );
    }

    loading() {
        this.api
            .call_server("help/get_overridden_help_messages")
            .then((response) => {
                this.message_list = response.message_list;
                this.empty = this.message_list.length == 0;
                // if (!this.empty)
                //     this.select_message(this.message_list[0]);
            });
    }

    attached() {
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    select_message(message) {
        let story_id = message.id;
        this.curr_story_id = story_id;
        this.api
            .call_server("help/get_help_message", { story_id: story_id })
            .then((response) => {
                this.left_text = response.prev_story_info.story_text;
                this.right_text = response.story_info.story_text;
                this.init = true;
            });
    }

    saved() {
        let message = this.message_list.find(
            (msg) => msg.id == this.curr_story_id
        );
        let data = { user_id: this.user.id };
        let story = {
            story_id: this.curr_story_id,
            story_text: this.right_text,
            used_for: this.api.constants.story_type.STORY4HELP,
            name: message.name,
        };
        data["story_info"] = story;
        this.api
            .call_server_post("members/save_story_info", data)
            .then((response) => {
                message.done = "done";
            });
    }

    accept_system(message) {
        this.api
            .call_server_post("help/accept_system", {
                story_id: this.curr_story_id,
            })
            .then((response) => {
                let idx = this.message_list.findIndex(
                    (msg) => msg.id == this.curr_story_id
                );
                this.message_list.splice(idx, 1);
            });
    }
}
