import { IMemberGateway } from "../services/gateway";
import { IUser } from "../services/user";
import { ITheme } from "../services/theme";
import { IHumanJson } from "../services/show-json";

export class Terms {
    output;
    code;
    prev_enabled;
    next_enabled;
    results;
    like = "";
    working = false;

    constructor(
        @IMemberGateway readonly api: IMemberGateway,
        @IUser readonly user: IUser,
        @ITheme readonly theme: ITheme,
        @IHumanJson readonly hj: IHumanJson
    ) {

    }

    attached() {
        this.theme.hide_menu = true;
        this.theme.hide_title = true;
        this.load_script();
    }

    load_script() {
        this.api.call_server("plugin_scripts/load_script").then((data) => {
            this.code = data.code;
            this.prev_enabled = data.prev_enabled;
            this.next_enabled = data.next_enabled;
        });
    }

    evaluate_script(code) {
        this.working = true;
        this.api
            .call_server_post("plugin_scripts/evaluate_script", {
                code: this.code,
            })
            .then((data) => {
                this.results = data.results;
                if (!this.results) {
                    const txt = JSON.stringify(data.results);
                    this.results = txt;
                }
                const node = this.hj.display(this.results);
                this.output.innerHTML = "";
                this.output.appendChild(node);
                this.working = false;
            });
    }

    prev_code(code) {
        this.api
            .call_server("plugin_scripts/prev_code", {
                code: this.code,
                like: this.like,
            })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled;
            });
    }

    next_code(code) {
        this.api
            .call_server("plugin_scripts/next_code", {
                code: this.code,
                like: this.like,
            })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled;
            });
    }

    delete(code) {
        this.api
            .call_server("plugin_scripts/delete", {
                code: this.code,
                like: this.like,
            })
            .then((data) => {
                this.code = data.code;
                this.prev_enabled = data.prev_enabled;
                this.next_enabled = data.next_enabled;
            });
    }
}
