import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { DialogService } from 'aurelia-dialog';
import { GroupEdit } from './group-edit';
import * as toastr from 'toastr';

@autoinject()
export class GroupManager {
    api;
    i18n;
    theme;
    group_list = [];
    curr_group;
    curr_group_orig;
    dialog;
    user_to_delete;
    pageSize = 15;
    filters = [
        { value: '', keys: ['first_name', 'last_name', 'email'] },
    ];

    constructor(api: MemberGateway, dialog: DialogService, theme: Theme, i18n: I18N) {
        this.api = api;
        this.dialog = dialog;
        this.theme = theme;
        this.i18n = i18n;
    }

    attached() {
        this.get_group_list();
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    get_group_list() {
        this.api.call_server('groups/get_group_list').
            then((data) => {
                this.group_list = data.grop_list;
                console.log("authorized users: ", this.group_list);
            });
    }

    add_or_update(group_data) {
        if (group_data) {
            this.curr_group_orig = deepClone(group_data);
            this.curr_group = group_data;
        }
        else {
            this.curr_group = { title: "", description: "" }
        }
        this.dialog.open({
            viewModel: GroupEdit, model: { curr_group: this.curr_group }, lock: true
        }).whenClosed(response => {
            if (response.wasCancelled) this.dialog.close()
            else this.save();
        });
    }

    save() {

    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}

