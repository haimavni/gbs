import { IDialogController } from "@aurelia/dialog";
import { IMemberGateway } from "../../../services/gateway";
import { I18N } from "@aurelia/i18n";
import { IMisc } from "../../../services/misc";
import { ITheme } from "../../../services/theme";
import { IUser } from "../../../services/user";

export class EditTopic {
    error_message = "";
    topic;
    old_data;
    can_delete = false;
    has_description = false;
    category = "";
    title;
    name_placeholder = "";
    description_placeholder = "";

    constructor(
        @IDialogController private readonly controller: IDialogController,
        @IMemberGateway private readonly api: IMemberGateway,
        @I18N private readonly i18n: I18N,
        @IMisc private readonly misc: IMisc,
        @ITheme private readonly theme: ITheme,
        @IUser private readonly user: IUser
    ) {}

    activate(params) {
        this.topic = params.topic;
        this.can_delete = params.can_delete;
        this.old_data = this.misc.deepClone(this.topic);
        this.category = params.category;
        this.has_description = this.category == "topic";
        let key = "multi-select." + this.category + "-title";
        this.title = this.i18n.tr(key);
        key = "multi-select." + this.category + "-name";
        this.name_placeholder = this.i18n.tr(key);
        if (this.has_description) {
            key = "multi-select." + this.category + "-description";
            this.description_placeholder = this.i18n.tr(key);
        }
    }

    save() {
        if (this.category != "topic") {
            this.controller.ok({ command: "rename" });
            return;
        }
        this.api
            .call_server_post("topics/update_topic_name_and_description", {
                topic: this.topic,
            })
            .then((data) => {
                if (data.user_error) {
                    this.error_message = this.i18n.tr(data.user_error);
                    return;
                }
                this.controller.ok({ command: "skip" });
            });
    }

    remove_topic() {
        this.controller.ok({ command: "remove-topic" });
    }

    cancel() {
        this.topic.name = this.old_data.name;
        this.topic.description = this.old_data.topic_description;
        this.controller.cancel();
    }

    get ready_to_save() {
        if (!this.topic.name) return false;
        if (
            this.topic.name == this.old_data.name &&
            this.topic.description == this.old_data.description
        )
            return false;
        return true;
    }
}
