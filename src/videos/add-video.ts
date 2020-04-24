import { DialogController } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject, computedFrom } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { Theme } from "../services/theme";
import { EventAggregator } from 'aurelia-event-aggregator';
import * as toastr from 'toastr';
import { User } from '../services/user';
import { Misc } from '../services/misc';

@autoinject()
export class AddVideo {
    controller;
    api;
    theme;
    user;
    i18n;
    header_text;
    params;
    old_params;
    misc;

    constructor(controller: DialogController, api: MemberGateway, theme: Theme, i18n: I18N, user: User, misc: Misc) {
        this.controller = controller;
        this.api = api;
        this.theme = theme;
        this.misc = misc;
        this.i18n = i18n;
        this.header_text = 'videos.header-text';
        this.user = user;
    }

    activate(model) {
        this.params = model.params;
        if (!this.params) {
            this.params = {
                src: '',
                name: '',
            }
        }
        this.old_params = this.misc.deepClone(this.params);
    }

    send() {
        this.api.call_server_post('photos/save_video', {params: this.params, user_id: this.user.id})
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
        this.params = this.misc.deepClone(this.old_params);
        this.controller.cancel();
    }

    @computedFrom('params.src', 'params.name', 'params.video_date_datestr', 'params.video_date_datespan')
    get dirty() {
        let dirty = JSON.stringify(this.params) != JSON.stringify(this.old_params);
        return dirty;
    }

}

