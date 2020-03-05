import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';
import { User } from '../services/user';
import { DialogService } from 'aurelia-dialog';
import { GroupEdit } from './group-edit';
import { copy_to_clipboard } from '../services/dom_utils';
import * as toastr from 'toastr';

@autoinject()
export class GroupManager {
    api;
    ea;
    i18n;
    theme;
    group_list = [];
    curr_group;
    dialog;
    user_to_delete;
    pageSize = 15;
    filters = [
        { value: '', keys: ['title', 'description'] },
    ];
    user;
    subscriber;

    constructor(api: MemberGateway, ea: EventAggregator, user: User, dialog: DialogService, theme: Theme, i18n: I18N) {
        this.api = api;
        this.ea = ea;
        this.dialog = dialog;
        this.theme = theme;
        this.i18n = i18n;
        this.user = user;
    }

    attached() {
        this.get_group_list();
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.subscriber = this.ea.subscribe('GROUP-LOGO-UPLOADED', msg => {
            let group = this.group_list.find(grp => grp.id == msg.group_id);
            group.logo_url = msg.logo_url;
            group.logo_images = null;
        });
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        this.subscriber.dispose();
    }

    get_group_list() {
        this.api.call_server('groups/get_group_list').
            then((data) => {
                this.group_list = data.group_list;
                for (let g of this.group_list) {
                    let logo_images: FileList;
                    g.logo_images = logo_images;
                }
            });
    }

    add_or_update(group_data) {
        let new_group = false;
        if (group_data) {
            this.curr_group = group_data;
        }
        else {
            this.curr_group = { title: "", description: "" };
            new_group = true;
        }
        this.dialog.open({
            viewModel: GroupEdit, model: { curr_group: this.curr_group, new_group: new_group, group_list: this.group_list }, lock: true
        });
    }

    upload_logo(group) {
        if (!group.logo_images) return;
        this.api.uploadFiles(
            this.user.id,
            group.logo_images,
            'LOGO',
            { group_id: group.id }
        )
    }

    delete_group(group) {
        this.api.call_server('groups/delete_group', { group_id: group.id })
            .then(result => {
                let idx = this.group_list.findIndex(grp => grp.id == group.id);
                this.group_list.splice(idx, 1);
            })
    }

    copy_link(group) {
        let url = `${location.host}${location.pathname}#/upload-photo/${group.id}/*`
        copy_to_clipboard(url);
        toastr.success(this.i18n.tr('groups.link-copied'))
    }

}
