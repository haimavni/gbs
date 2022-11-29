import { autoinject, computedFrom } from 'aurelia-framework';
import { DialogController } from 'aurelia-dialog';
import { MemberGateway } from '../../../../_OLD/src/services/gateway';
import { I18N, TCustomAttribute } from 'aurelia-i18n';
import { Misc } from '../../../../_OLD/src/services/misc';

@autoinject
export class EditItem {
    api;
    i18n;
    controller: DialogController;
    error_message = "";
    item;
    old_data;
    can_delete = false;
    has_description = false;
    category = '';
    title;
    name_placeholder = "";
    description_placeholder = "";
    misc;

    constructor(controller: DialogController, api: MemberGateway, i18n: I18N, misc: Misc) {
        this.controller = controller;
        this.api = api;
        this.i18n = i18n;
        this.misc = misc;
    }

    activate(params) {
        this.item = params.item;
        this.can_delete = params.can_delete;
        this.old_data = this.misc.deepClone(this.item);
        this.category = params.category;
        this.has_description = true; //this.category == 'item';
        let key = 'picker.' + this.category + '-title';
        this.title = this.i18n.tr(key);
        key = 'picker.' + this.category + '-name';
        this.name_placeholder = this.i18n.tr(key);
        if (this.has_description) {
            key = 'picker.' + this.category + '-description'
            this.description_placeholder = this.i18n.tr(key);
        }
    }

    save() {
        if (this.category != 'item') {
            this.controller.ok({command: 'modify-item'});
            return;
        }
        this.api.call_server_post('topics/update_item_name_and_description', {item: this.item})
            .then((data) => {
                if (data.user_error) {
                    this.error_message = this.i18n.tr(data.user_error);
                    return;
                }
                this.controller.ok({command: 'skip'});
            });
    }

    remove_item() {
        this.controller.ok({command: 'remove-item'})
    }

    cancel() {
        this.item.name = this.old_data.name;
        this.item.description = this.old_data.item_description;
        this.controller.cancel();
    }

    @computedFrom('item.name', 'item.description')
    get ready_to_save() {
        if (! this.item.name) return false;
        if (this.item.name == this.old_data.name && this.item.description == this.old_data.description) return false;
        return true;
    }

}
