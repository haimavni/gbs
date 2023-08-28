import {
    bindable,
    inject,
    bindingMode,
    computedFrom,
    DOM,
} from "aurelia-framework";
import { User } from "../../../services/user";
import { Theme } from "../../../services/theme";
import { I18N } from "aurelia-i18n";
import { MemberGateway } from "../../../services/gateway";
import { EventAggregator } from "aurelia-event-aggregator";

@inject(User, Theme, DOM.Element, I18N, MemberGateway, EventAggregator)
export class PhotoUploaderCustomElement {
    user;
    theme;
    i18n;
    element;
    api: MemberGateway;
    working = false;
    photo_uploaded = false;
    photos: FileList;
    @bindable key = "";
    @bindable payload;
    @bindable help_topic: string = "unknown";
    ea: EventAggregator;
    subscriber;
    prompt = "Search a photo"

    constructor(
        user: User,
        theme: Theme,
        element,
        i18n: I18N,
        api: MemberGateway,
        ea: EventAggregator
    ) {
        this.user = user;
        this.theme = theme;
        this.element = element;
        this.i18n = i18n;
        this.api = api;
        this.ea = ea;
        this.prompt = this.i18n.tr("select-a-photo")
    }

    save_photo(event: Event) {
        event.stopPropagation();
        this.working = true;
        console.log(
            "uid, photos, key, payload ",
            this.user.id,
            this.photos,
            this.key,
            this.payload
        );
        this.api.uploadFiles(this.user.id, this.photos, this.key, this.payload);
    }

    attached() {
        this.subscriber = this.ea.subscribe(this.key + "-UPLOADED", msg => {
            console.log("data from server is ", msg);
            this.working = false;
            this.photos = null;
            this.dispatch_event();
        });
    }

    detached() {
        this.subscriber.dispose();
    }

    @computedFrom("photos", "photo_uploaded")
    get phase() {
        if (this.photo_uploaded) {
            this.photo_uploaded = false;
            this.photos = null;
            this.working = false;
            //return 'photo-uploaded';
        }
        if (this.photos && this.photos.length > 0) return "ready-to-save";
        return "ready-to-select";
    }

    dispatch_event() {
        const uploadedEvent = new CustomEvent('uploaded', {
            bubbles: true
        });
        this.element.dispatchEvent(uploadedEvent);
    }

}
