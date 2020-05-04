import { autoinject, computedFrom } from "aurelia-framework";
import { I18N } from "aurelia-i18n";
import { Theme } from '../services/theme';
import { MemberGateway } from '../services/gateway';
import { EventAggregator } from 'aurelia-event-aggregator';
import { User } from '../services/user';
import { DialogService } from 'aurelia-dialog';
import { GroupEdit } from './group-edit';
import { ContactEdit } from './contact-edit';
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
    curr_group_id = 0;
    curr_contact;
    dialog;
    user_to_delete;
    pageSize = 15;
    filters = [
        { value: '', keys: ['title', 'description'] },
    ];
    user;
    subscriber;
    subscriber1;
    group_mail_url;
    contact_list = [];
    params = {
        mail_body: ""
    }
    need_to_show = "";
    mail_sent = false;
    csv_list = [];

    constructor(api: MemberGateway, ea: EventAggregator, user: User, dialog: DialogService, theme: Theme, i18n: I18N) {
        this.api = api;
        this.ea = ea;
        this.dialog = dialog;
        this.theme = theme;
        this.i18n = i18n;
        this.user = user;
        this.need_to_show = this.i18n.tr('groups.need-to-show');
    }

    attached() {
        this.get_group_list();
        this.get_contact_list();
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.subscriber = this.ea.subscribe('GROUP-LOGO-UPLOADED', msg => {
            let group = this.group_list.find(grp => grp.id == msg.group_id);
            group.logo_url = msg.logo_url;
            group.logo_images = null;
        });
        this.subscriber1 = this.ea.subscribe('CONTACTS-FILE-UPLOADED', msg => {
            this.get_contact_list();
            this.csv_list = [];
        })
    }

    detached() {
        this.theme.hide_title = false;
        this.theme.hide_menu = false;
        this.subscriber.dispose();
        this.subscriber1.dispose();
    }

    get_group_list() {
        this.api.call_server('groups/get_group_list')
            .then((data) => {
                this.group_list = data.group_list;
                for (let g of this.group_list) {
                    let logo_images: FileList;
                    g.logo_images = logo_images;
                    g.mail_url = this.email_link(g);
                }
            });
    }

    get_contact_list() {
        this.api.call_server('groups/get_contact_list')
            .then(data => this.contact_list = data.contact_list);
    }


    add_or_update_group(group_data) {
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

    add_or_update_contact(contact_data) {
        let new_contact = false;
        if (contact_data) {
            this.curr_contact = contact_data;
        }
        else {
            this.curr_contact = { email: "", first_name: "", last_name: "", group_id: this.curr_group_id };
            new_contact = true;
        }
        this.dialog.open({
            viewModel: ContactEdit, model: { curr_contact: this.curr_contact, new_contact: new_contact, contact_list: this.contact_list }, lock: true
        });
    }

    upload_contacts() {
        this.api.uploadFiles(
            this.user.id,
            this.csv_list,
            'CONTACTS',
            { group_id: this.curr_group_id }
        )

    }

    remove_contact(contact_data) {
        this.api.call_server('groups/remove_contact', { group_id: this.curr_group_id, contact_id: contact_data.id })
            .then(result => {
                this.contact_list = this.contact_list.filter(contact => contact.id != contact_data.id || contact.group_id != this.curr_group_id);
            })
    }

    upload_logo(group) {
        if (!group.logo_images) return;
        this.api.uploadFiles(
            this.user.id,
            group.logo_images,
            'GROUP-LOGO',
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
        let url = `${location.host}${location.pathname}#/upload-photo/${group.id}/*`;
        copy_to_clipboard(url);
        toastr.success(this.i18n.tr('groups.link-copied'))
    }

    email_link(group) {
        let url = `${location.host}${location.pathname}#/upload-photo/${group.id}/*`;
        let click = this.i18n.tr('groups.click')
        let to_upload = this.i18n.tr('groups.to-upload')
        let regards = this.i18n.tr('groups.regards')
        let a = `${url} :${click}\n\n${regards}`
        a = encodeURIComponent(a);
        return a;
    }

    expose_contacts(group) {
        if (this.curr_group_id == group.id) {
            this.curr_group_id = 0
        } else {
            this.curr_group_id = group.id
            this.curr_group = group;
        }
    }

    send_the_letter() {
        this.mail_contacts();
    }

    mail_contacts() {
        if (!this.params.mail_body) return;
        let mail_body = this.params.mail_body;
        if (this.theme.rtltr == 'rtl') {
            mail_body = '<div dir="rtl">' + mail_body + '</div>';
        }
        mail_body = encodeURI(mail_body);
        this.api.call_server_post('groups/mail_contacts', { group_id: this.curr_group_id, mail_body: mail_body, from_name: this.curr_group.title })
            .then(response => {
                this.mail_sent = true;
                this.curr_group_id = 0;
            });
    }

    @computedFrom('curr_group_id')
    get button_text() {
        if (this.curr_group_id) return 'groups.edit-letter';
        return 'groups.edit-letter-template';
    }

    @computedFrom('curr_group_id')
    get mail_params() {
        if (this.curr_group_id) {
            this.params.mail_body = "";
            let url = `${location.host}${location.pathname}#/upload-photo/${this.curr_group_id}/*`;
            if (url.startsWith('localhost'))
                url = `https://gbstories.org/gbs_crossing/static/aurelia//index-gbs_crossing.html#/upload-photo/${this.curr_group_id}/*`
            else {
                url = 'https://' + url;
            }
            let label = this.i18n.tr('groups.the-link')
            let link = `<a href="${url}" target="_blank">${label}</a>`
            return { group_name: this.curr_group.title, group_description: this.curr_group.description, link: link }
        } else {
            return {};
        }
    }

    @computedFrom('curr_group_id')
    get editing_template() {
        return !this.curr_group_id;
    }

    @computedFrom('mail_sent')
    get mail_contacts_caption() {
        let s = '';
        if (this.mail_sent) s = 'groups.mail-was-sent'
        else s = 'groups.mail-contacts';
        return this.i18n.tr(s);
    }


}

