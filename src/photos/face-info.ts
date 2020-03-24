import { DialogController, DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';
import { autoinject } from 'aurelia-framework';
import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";

@autoinject()
export class FaceInfo {
    controller;
    service;
    api;
    user;
    theme;
    i18n;
    //----------------
    face;
    step = 2;

    constructor(controller: DialogController, service: DialogService, api: MemberGateway, user: User, theme: Theme, i18n: I18N) {
        this.controller = controller;
        this.service = service;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
    }

    activate(model) {
        this.face = model.face;
    }

    cancel_identification() {
        this.controller.ok({ command: 'cancel-identification' });
    }

    save_face_location() {
        this.controller.ok({command: 'save-face-location'});
    }

    move_face(dir) {
        switch (dir) {
            case 'up':
                this.face.y -= this.step;
                break;
            case 'left':
                this.face.x -= this.step;
                break;
            case 'down':
                this.face.y += this.step;
                break;
            case 'right':
                this.face.x += this.step;
                break;
        }
    }

    change_radius(what) {
        if (what == 'bigger') {
            this.face.r += this.step
        } else {
            this.face.r -= this.step;
        }
    }


}
