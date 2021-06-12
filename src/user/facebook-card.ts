import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import * as toastr from 'toastr';

@autoinject()
export class FacebookCard {
    controller;
    api;
    user;
    theme;
    i18n;
    message: string = "";
    message_type;
    title;
    sub_title;
    current_url;
    img_src;
    description;
    card_url;

    constructor(controller: DialogController, api: MemberGateway, user: User, theme: Theme, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
    }

    activate(model) {
        this.current_url = model.current_url;
        this.img_src = model.img_src;
        this.title = this.i18n.tr('app-title');
        if (this.img_src) {
            this.message = 'user.sharing.replace-photo';
            this.message_type = 'info';
        } else {
            this.message = 'user.sharing.missing-photo';
            this.message_type = 'warning';
        }
    }

    create_card() {
        let title = this.title;
        if (this.sub_title) {
            title += ': ' + this.sub_title;
        }
        this.api.call_server_post('default/create_fb_card',
            {img_src: this.img_src, url: this.current_url, title: title, description: this.description})
            .then(response => {
                this.card_url = response.card_url;
                //this.controller.ok();
            })
    }

}
