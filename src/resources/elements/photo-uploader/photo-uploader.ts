import { bindable, inject, bindingMode, computedFrom, DOM } from 'aurelia-framework';
import { User } from '../../../services/user';
import { Theme } from '../../../services/theme';
import { I18N } from 'aurelia-i18n';
import { MemberGateway } from '../../../services/gateway';

@inject(User, Theme, DOM.Element, I18N, MemberGateway)
export class PhotoUploaderCustomElement {
    user;
    theme;
    i18n;
    element;
    api: MemberGateway;
    working = false;
    photo_uploaded = false;
    thumbnails: FileList;
    @bindable key = "";
    @bindable payload;

    constructor(user: User, theme: Theme, element, i18n, api) {
        this.user = user;
        this.theme = theme;
        this.element = element;
        this.i18n = i18n;
        this.api = api;
    }

    save_thumbnail(event: Event) {
        event.stopPropagation();
        this.working = true;
        this.api.uploadFiles(
            this.user.id,
            this.thumbnails,
            this.key,
            this.payload
        )
    }

    @computedFrom('thumbnails', 'photo_uploaded')
    get phase() {
        if (this.photo_uploaded) {
            this.photo_uploaded = false;
            this.thumbnails = null;
            //return 'photo-uploaded';
        }
        if (this.thumbnails && this.thumbnails.length > 0) return 'ready-to-save';
        return 'ready-to-select';
    }


}
