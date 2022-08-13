import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { copy_to_clipboard } from '../services/dom_utils';
import { Popup } from '../services/popups';

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
    current_url;
    img_src;
    description;
    card_url;
    popup;

    constructor(controller: DialogController, api: MemberGateway, user: User, theme: Theme, popup: Popup, i18n: I18N) {
        this.controller = controller;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
        this.popup = popup;
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
        this.api.call_server_post('default/create_fb_card',
            {img_src: this.img_src, url: this.current_url, title: title, description: this.description})
            .then(response => {
                this.card_url = response.card_url;
                copy_to_clipboard(this.card_url)
                //this.controller.ok();
            })
    }

    submit_it() {
        let href=`https://facebook.com/sharer/sharer.php?u=${this.card_url}&t=${this.title}`;
        this.popup.popup('SHARER', href, "height=600,width=800,left=200,top=100");
    }

}
