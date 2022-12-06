import { I18N } from "@aurelia/i18n";
import {
    ICustomElementViewModel,
    IDialogController,
    IDialogService,
} from "aurelia";
import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";

export class FaceInfo implements ICustomElementViewModel {
    face;
    step = 2;
    ux_dialog;
    photo_x;
    photo_width;
    face_x;

    constructor(
        @IDialogController readonly controller: IDialogController,
        @IDialogService readonly service: IDialogService,
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @I18N readonly i18n: I18N
    ) {
        this.controller = controller;
        this.service = service;
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.i18n = i18n;
    }

    activate(model) {
        this.face = model.face;
        this.photo_x = model.photo_x;
        this.photo_width = model.photo_width;
        this.face_x = model.face_x;
    }

    async attached() {
        await sleep(100);

        if (this.ux_dialog) {
            const parent = this.ux_dialog.parentNode;
            if (parent) {
                const grand = parent.parentNode;
                const rect = grand.getBoundingClientRect();
                let x;
                if (this.face_x - this.photo_x > this.photo_width / 2)
                    x = this.photo_x;
                else x = this.photo_x + this.photo_width - rect.width + 32;
                grand.style.marginLeft = `${x}px`;
            }
        }
    }

    cancel_identification() {
        this.controller.ok({ command: "cancel-identification" });
    }

    save_face_location() {
        this.controller.ok({ command: "save-face-location" });
    }

    move_face(dir) {
        switch (dir) {
            case "up":
                this.face.y -= this.step;
                break;
            case "left":
                this.face.x -= this.step;
                break;
            case "down":
                this.face.y += this.step;
                break;
            case "right":
                this.face.x += this.step;
                break;
        }
    }

    change_radius(what) {
        if (what == "bigger") {
            this.face.r += this.step;
        } else {
            this.face.r -= this.step;
        }
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
