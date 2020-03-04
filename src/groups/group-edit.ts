import { autoinject } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';

@autoinject
export class GroupEdit {
    api;
    curr_group;
    new_group = false;
    controller: DialogController;
    error_message = "";
    group_list;
    curr_group_orig = {};

    constructor(controller: DialogController, api: MemberGateway) {
        this.controller = controller;
        this.api = api;
    }

    activate(params) {
        this.new_group = params.new_group
        this.curr_group = params.curr_group;
        this.group_list = params.group_list;
        if (this.new_group) return;
        this.curr_group_orig = deepClone(this.curr_group)
    }

    save() {
        this.api.call_server_post('groups/add_or_update_group', this.curr_group)
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
            for (let f of this.curr_group) {
                this.curr_group[f] = this.curr_group_orig[f];
            }
        }
        this.controller.cancel();
    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
