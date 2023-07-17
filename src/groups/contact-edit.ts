import { IDialogController } from "@aurelia/dialog";
import { IMemberGateway } from "../services/gateway";
import { IMisc } from "../services/misc";

export class ContactEdit {
    curr_contact;
    new_contact = false;
    error_message = "";
    contact_list;
    curr_contact_orig = {};

    constructor(
        @IDialogController private readonly controller: IDialogController,
        @IMemberGateway private readonly api: IMemberGateway,
        @IMisc private readonly misc: IMisc
    ) {}

    loading(params) {
        this.new_contact = params.new_contact;
        this.curr_contact = params.curr_contact;
        this.contact_list = params.contact_list;
        if (this.new_contact) return;
        this.curr_contact_orig = this.misc.deepClone(this.curr_contact);
    }

    save() {
        this.api
            .call_server_post("groups/add_or_update_contact", this.curr_contact)
            .then((data) => {
                if (data.error || data.user_error) {
                    this.error_message = data.user_error;
                    return;
                }
                if (this.new_contact) {
                    this.contact_list.push(data.contact_data);
                }
                this.controller.ok();
            });
    }

    cancel() {
        if (!this.new_contact) {
            for (let f of this.curr_contact) {
                this.curr_contact[f] = this.curr_contact_orig[f];
            }
        }
        this.controller.cancel();
    }
}
