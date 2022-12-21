import { IDialogController } from 'aurelia';
import { IMemberGateway } from '../services/gateway';
import { IMisc } from '../services/misc';

export class GroupEdit {
    curr_group;
    new_group = false;
    error_message = '';
    group_list;
    curr_group_orig = {};

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IMemberGateway readonly api: IMemberGateway,
        @IMisc readonly misc: IMisc
    ) {}

    loading(params) {
        this.new_group = params.new_group;
        this.curr_group = params.curr_group;
        this.group_list = params.group_list;

        if (this.new_group) {
            return;
        }

        this.curr_group_orig = this.misc.deepClone(this.curr_group);
    }

    save() {
        this.api
            .call_server_post('groups/add_or_update_group', this.curr_group)
            .then((data) => {
                if (data.error || data.user_error) {
                    this.error_message = data.user_error;
                    return;
                }

                if (this.new_group) {
                    this.group_list.push(data.group_data);
                }

                this.controller.ok();
            });
    }

    cancel() {
        if (!this.new_group) {
            for (const f of this.curr_group) {
                this.curr_group[f] = this.curr_group_orig[f];
            }
        }

        this.controller.cancel();
    }
}
