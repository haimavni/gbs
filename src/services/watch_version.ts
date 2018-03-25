import environment from '../environment';
import { autoinject, singleton, noView } from "aurelia-framework";
import { MemberGateway } from './gateway';
import { DialogService } from 'aurelia-dialog';
import { I18N } from 'aurelia-i18n';

@autoinject()
@singleton()
@noView()
export class WatchVersion {
    api;
    nudnik;
    user_warned = false;
    dialog;
    i18n;

    constructor(api: MemberGateway, dialog: DialogService, i18n: I18N) {
        this.api = api;
        this.verify_latest_version();
        this.nudnik = setInterval(this.verify_latest_version, 10000);
        this.dialog = dialog;
        this.i18n = i18n;
    }

    verify_latest_version() {
        let enversion = environment.version;
        console.log("enter verify. enversion: ", enversion);
        if (!enversion) {
            return
        }
        this.api.call_server('default/get_curr_version')
            .then(response => {
                console.log("curr version: ", response);
                if (enversion && environment.version != response.version) {
                    alert("Please refresh! Your version is " + enversion + ". Current version: " + response.version);
                    if (!this.user_warned) {
                        clearInterval(this.nudnik);
                        this.nudnik = setInterval(this.verify_latest_version, 3600000);
                    }
                    this.user_warned = true;
                }
            })
    }

}