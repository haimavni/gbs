import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import * as toastr from 'toastr';
import { User } from '../services/user';

@autoinject()
export class AddVideo {
    controller;
    api;
    theme;
    user;
    i18n;
    header_text;
    params = {
        video_address: '',
        video_name: '',
        user_id: null
    }

    constructor(controller: DialogController, api: MemberGateway, theme: Theme, i18n: I18N, user: User) {
        this.controller = controller;
        this.api = api;
        this.theme = theme;
        this.i18n = i18n;
        this.header_text = 'videos.header-text';
        this.user = user;
    }

    send() {
        this.params.user_id = this.user.id;
        this.api.call_server_post('members/save_video', this.params)
            .then(response => {
                if (response.user_error || response.error) {
                    //toastr.warning("<p dir='rtl'>" + this.i18n.tr(response.user_error) + "</p>", '', 10000);
                } else {
                    toastr.success("<p dir='rtl'>" + this.i18n.tr('video.message-successful') + "</p>", '', 10000);
                }
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('params.video_address', 'params.video_name')
    get is_disabled() {
        return (this.params.video_address=='' || this.params.video_name=='');
    }

}
