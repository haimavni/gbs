import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Router } from "aurelia-router";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { DialogService } from 'aurelia-dialog';

@autoinject()
export class AccessManager {
    api;
    i18n;
    router;
    theme;
    authorized_users = [];
    curr_user;
    curr_user_ref;
    dialog;

    constructor(api: MemberGateway, dialog: DialogService) {
        this.api = api;
        this.dialog = dialog;
    }

    attached() {
        this.get_authorized_users();
    }

    get_authorized_users() {
        this.api.call_server('admin/get_authorized_users').
            then((data) => {
                this.authorized_users = data.authorized_users;
            });
    }

    role_class = function (r) {
        let cls;
        switch (r.role) {
            case 'DEVELOPER':
                cls = 'fa-cogs';
                break;
            case 'ACCESS_MANAGER':
                cls = 'fa-th';
                break;
            case 'ADMIN':
                cls = 'fa-star';
                break;
            case 'TESTER':
                cls = 'fa-certificate';
                break;
            case 'EDITOR':
                cls = 'fa-pencil';
                break;
            case 'COMMENTATOR':
                cls = 'fa-comment';
                break;
            case 'PHOTO_UPLOADER':
                cls = 'fa-camera';
                break;
            case 'CHATTER':
                cls = 'fa-group';
                break;
            case 'CHAT_MODERATOR':
                cls = 'fa-anchor';
                break;
            case 'TEXT_AUDITOR':
                cls = 'fa-shield';
                break;
            case 'DATA_AUDITOR':
                cls = 'fa-thumbs-up';
                break;
            case 'HELP_AUTHOR':
                cls = 'fa-life-saver fa-pencil';
                break;
            case 'ADVANCED':
                cls = 'fa-certificate';
                break;
            case 'MAIL_WATCHER':
                cls = 'fa-envelope';
                break;
        }
        if (r.active) {
            cls += ' is_active';
        }
        return cls;
    }

    toggle_membership(r, id) {
        r.id = id
        this.api.call_server('admin/toggle_membership', r)
            .then((data) => {
                for (let user of this.authorized_users) {
                    if (user.id == data.id) {
                        for (r in user.roles) {
                            let role = user.roles[r];
                            if (role.role == data.role) {
                                role.active = data.active;
                                break;
                            }
                        }
                        break;
                    }
                }
            });
    }

    add_or_update(user_data)
    {
        if (user_data)
        {
            this.curr_user = deepClone(user_data);
            this.curr_user_ref = user_data;
        }
        else
        {
            this.curr_user = {last_name: "", service_level: 'standard'}
        }
        this.dialog.open({
            template: 'add_or_update_template',
        });
    }

}

function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
    //use Object.assign({}, obj) if you don't need a deep clone
}
