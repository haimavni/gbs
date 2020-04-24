import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Theme } from '../services/theme';
import { Misc } from '../services/misc';
import { MemberGateway } from '../services/gateway';
import { DialogService } from 'aurelia-dialog';
import { EditUser } from './edit-user';
import * as toastr from 'toastr';

@autoinject()
export class AccessManager {
    api;
    i18n;
    theme;
    authorized_users = [];
    curr_user;
    curr_user_orig;
    dialog;
    user_to_delete;
    pageSize = 15;
    filters = [
        { value: '', keys: ['first_name', 'last_name', 'email'] },
        { value: 'all-users', custom: this.statusFilter }
    ];
    statuses =  ['all-users', 'registered-users', 'unregistered-users'];
    misc;

    constructor(api: MemberGateway, dialog: DialogService, theme: Theme, i18n: I18N, misc: Misc) {
        this.api = api;
        this.dialog = dialog;
        this.theme = theme;
        this.misc = misc;
        this.i18n = i18n;
    }

    attached() {
        this.get_authorized_users();
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
    }

    get_authorized_users() {
        this.api.call_server('admin/get_authorized_users').
            then((data) => {
                this.authorized_users = data.authorized_users;
            });
    }

    role_class(r) {
        const class_of_role = {
            DEVELOPER: 'fa-cogs',
            ACCESS_MANAGER: 'fa-th',
            ADMIN: 'fa-star',
            TESTER: 'fa-certificate',
            EDITOR: 'fa-pencil',
            COMMENTATOR: 'fa-comment',
            PHOTO_UPLOADER: 'fa-camera',
            CHATTER: 'fa-comments',
            CHAT_MODERATOR: 'fa-anchor',
            TEXT_AUDITOR: 'fa-shield',
            DATA_AUDITOR: 'fa-thumbs-up',
            HELP_AUTHOR: 'fa-life-saver fa-pencil',
            ADVANCED: 'fa-user-md',
            MAIL_WATCHER: 'fa-envelope',
            ARCHIVER: 'fa-archive',
            RESTRICTED: 'fa-do-not-enter'
        }
        return class_of_role[r.role];
    }

    role_title(r) {
        let role = 'admin.' + r.role.toLowerCase();
        return this.i18n.tr(role)
    }

    toggle_membership(r, id) {
        r.id = id
        this.api.call_server('admin/toggle_membership', r)
            .then((data) => {
                let user = this.authorized_users.find(u => u.id == data.id);
                let role = user.roles.find(r => r.role == data.role);
                role.active = data.active;

            });
    }

    add_or_update(user_data) {
        if (user_data) {
            this.curr_user_orig = this.misc.deepClone(user_data);
            this.curr_user = user_data;
        }
        else {
            this.curr_user = { last_name: "" }
        }
        this.dialog.open({
            viewModel: EditUser, model: { curr_user: this.curr_user }, lock: true
        }).whenClosed(response => {
            if (response.wasCancelled) this.dialog.close()
            else this.save();
        });
    }

    unlock_user(uid) {
        this.api.call_server('admin/unlock_user', { user_id: uid }).
            then(
            (result) => {
                toastr.success('The user can now login');
            });
    }

    resend_verification_email(uid) {
        this.api.call_server('admin/resend_verification_email', { user_id: uid }).
            then(
            (result) => {
                toastr.success('Verification email was sent');
            });
    }

    delete_user(usr) {
        this.user_to_delete = usr;
        if (confirm('OK to delete?')) {
            this.api.call_server_post('admin/delete_user', usr).
                then((data) => {
                    var uid = parseInt(data.id);
                    var idx = this.authorized_users.findIndex(item => item.id == data.id);
                    this.authorized_users.splice(idx, 1);
                });
        }
    }

    save() {
        this.api.call_server_post('admin/add_or_update_user', this.curr_user)
            .then((data) => {
                if (data.error || data.user_error) {
                    return;
                }
                if (data.new_user) {
                    this.authorized_users.push(data.user_data);
                }
                else setTimeout(function () {
                    for (let f of data.user_data) {
                        this.curr_user_orig[f] = data.user_data[f];
                    }
                });
                setTimeout(function () {
                    this.dialog.close('good');
                });
            });
    }

    statusFilter(filterValue, user) {
        let r = user.registration_key;
        if (!r) r = "";
        switch (filterValue) {
            case "all-users":
                return true;
            case "registered-users":
                return r == "";
            case "unregistered-users":
                return r != "";
        }
        return true;
    }

}
