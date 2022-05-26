import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { I18N, TCustomAttribute } from 'aurelia-i18n';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import * as download from 'downloadjs';

@autoinject
export class MakeQRCode {
    api;
    i18n;
    controller: DialogController;
    error_message = "";
    qrname = "";
    url;
    title;
    name_placeholder = "";
    misc;
    theme;

    constructor(controller: DialogController, api: MemberGateway, i18n: I18N, misc: Misc, theme: Theme) {
        this.controller = controller;
        this.api = api;
        this.i18n = i18n;
        this.misc = misc;
        this.theme = theme;
    }

    activate(params) {
        console.log("params: ", params)
        this.url = params.url;
        this.name_placeholder = this.i18n.tr('user.qrcode-name');
    }

    save() {
        this.api.call_server_post('default/create_qrcode', {url: this.url, name: this.qrname})
        .then(response => {
            let download_url = response.download_url;
            console.log('download url: ', download_url);
            download(download_url);
            this.controller.ok();
        });
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('qrname')
    get ready_to_save() {
        if (! this.qrname) return false;
        return true;
    }

}
