import { MemberGateway } from '../services/gateway';
import { User } from "../services/user";
import { Theme } from "../services/theme";
import { autoinject } from 'aurelia-framework';
import { HumanJson } from "../services/show-json";

@autoinject
export class Terms {
    api;
    user;
    theme;
    hj;
    output;
    code;
    prev_enabled;
    next_enabled;
    results;
    like = "";
    working = false;

    constructor(api: MemberGateway, user: User, theme: Theme, hj: HumanJson) {
        this.api = api;
        this.user = user;
        this.theme = theme;
        this.hj = hj;
    }

    attached() {
        this.theme.hide_menu = true;
        this.theme.hide_title = true;
        this.load_script();
    }

    load_script() {
        this.api.call_server('plugin_scripts/load_script')
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled
            });
    }

    evaluate_script(code) {
        this.working = true;
        this.api.call_server('plugin_scripts/evaluate_script', { code: this.code })
            .then((data) => {
                this.results = data.results;
                let node = this.hj.display(this.results);
                this.output.innerHTML = "";
                this.output.appendChild(node);
                this.working = false;
            });
    }

    prev_code(code) {
        this.api.call_server('plugin_scripts/prev_code', { code: this.code, like: this.like })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled
            });
    }

    next_code(code) {
        this.api.call_server('plugin_scripts/next_code', { code: this.code, like: this.like })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled
            });
    }

    delete(code) {
        this.api.call_server('plugin_scripts/delete', { code: this.code, like: this.like })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled
            });
    }

}
