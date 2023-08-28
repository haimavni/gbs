import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../services/gateway';
import { I18N, TCustomAttribute } from 'aurelia-i18n';
import { Misc } from '../services/misc';
import { Theme } from '../services/theme';
import { User } from '../services/user';

@autoinject
export class ReplaceThumbnail {
    api: MemberGateway;
    i18n: I18N;
    controller: DialogController;
    error_message = "";
    title: string;
    name_placeholder = "Thumbnail URL";
    misc: Misc;
    theme: Theme;
    user: User;
    doc: any;
    doc_jpg_url: string = "";
    curr_doc_jpg_url: string = "";
    
    constructor(controller: DialogController, api: MemberGateway, i18n: I18N, misc: Misc, theme: Theme, user: User) {
        this.controller = controller;
        this.api = api;
        this.i18n = i18n;
        this.misc = misc;
        this.theme = theme;
        this.user = user;
    }

    activate(params) {
        this.doc = params.doc;
        console.log("------this doc is ", this.doc);
        this.curr_doc_jpg_url = this.doc.doc_jpg_url;
        this.title = this.i18n.tr('docs.enter-thumbnail') + this.doc.name;
    }

    url_changed(event) {
        console.log("url changned. ")
        this.curr_doc_jpg_url = this.doc_jpg_url;
    }

    save() {
       this.doc.doc_jpg_url = this.doc_jpg_url;
       this.api.call_server_post("docs/replace_doc_jpg_url", {"doc_id": this.doc.id, "doc_jpg_url": this.doc_jpg_url});
    }

    cancel() {
        this.controller.cancel();
    }

    @computedFrom('doc_jpg_url')
    get ready_to_save() {
        if (! this.doc_jpg_url) return false;
        return true;
    }

    on_uploaded() {
        // force refresh
        this.curr_doc_jpg_url += 'z';
    }

}
