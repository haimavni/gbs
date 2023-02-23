import { IDialogController } from '@aurelia/dialog';
import { IMemberGateway } from '../services/gateway';
import { I18N } from '@aurelia/i18n';
import { ITheme } from '../services/theme';
import * as download from 'downloadjs';

export class QrPhoto {
    data = {
        width: null,
        height: null,
        position: 'se',
        photo_id: null,
        shortcut: null,
    };
    message = '';
    message_type = '';
    done = false;
    qpositions = ['ne', 'se', 'sw', 'nw'];

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @ITheme readonly theme: ITheme,
        @IDialogController readonly controller: IDialogController,
        @I18N readonly i18n: I18N
    ) {}

    loading(params) {
        this.data.photo_id = params.photo_id;
        this.data.shortcut = params.shortcut;
    }

    set_qposition(qp) {
        this.data.position = qp;
    }

    save() {
        if (this.disabled_if) return;
        this.api
            .call_server_post('photos/create_qr_photo', { data: this.data })
            .then((response) => {
                const download_url = response.download_url;
                console.log('download url: ', download_url);
                if (download_url) download(download_url);
                this.controller.ok();
            });
    }

    cancel() {
        this.controller.cancel();
    }

    get disabled_if() {
        const ready = this.data.width || this.data.height;
        return ready ? '' : 'disabled';
    }

    changed(what) {
        if (what == 'width') {
            this.data.height = null;
        } else {
            this.data.width = null;
        }
    }
}
