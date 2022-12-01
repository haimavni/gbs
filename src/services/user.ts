import { IMemberGateway } from "./gateway";
import { I18N } from "@aurelia/i18n";
import { ICookies } from "./cookies";
import { DI, IEventAggregator } from "aurelia";

export const IUser = DI.createInterface<IUser>("IUser", (x) =>
    x.singleton(User)
);
export type IUser = User;

export class User {
    public isLoggedIn: boolean;
    public editing: boolean;
    public user_name;
    public privileges;
    public config = {
        enable_auto_registration: false,
        expose_new_app_button: false,
        support_audio: false,
        cover_photo: "",
        cover_photo_id: null,
        exclusive: false,
        enable_cuepoints: false,
        terms_enabled: false,
    };
    config_ready = false;
    public id;
    public _advanced;
    private photo_link_src = "";
    curr_photo_id;
    app_list = [];
    _editing_mode_changed = false;

    constructor(
        @IEventAggregator readonly eventAggregator: IEventAggregator,
        @IMemberGateway readonly api: IMemberGateway,
        @I18N readonly i18n: I18N,
        @ICookies readonly cookies: ICookies
    ) {
        this.isLoggedIn = false;
        this.editing = false;
        this.privileges = { EDITOR: true };
        this.readPrivileges();
        this.readConfiguration();

        this.eventAggregator.subscribe("ROLE_CHANGED", (payload) => {
            this.handle_role_change(payload);
        });
    }

    handle_role_change(payload) {
        if (this.id == parseInt(payload.user_id)) {
            this.privileges[payload.role] = payload.active;
        }
    }

    toggle_edit_mode() {
        this.editing = !this.editing;
        this._editing_mode_changed = true;
        this.eventAggregator.publish("EditModeChange", this);
    }

    get editing_mode_changed() {
        const b = this._editing_mode_changed;
        this._editing_mode_changed = false;
        return b;
    }

    readPrivileges() {
        return this.api
            .call_server("default/read_privileges")
            .then((result) => {
                this.isLoggedIn = result.user_id > 0;
                this.privileges = result.privileges;
                this.user_name = result.user_name;
                this.id = result.user_id;
            });
    }

    readConfiguration() {
        return this.api
            .call_server("default/read_configuration")
            .then((result) => {
                this.config = result.config;
                this.config_ready = true;
                if (!this.photo_link_src && this.config.cover_photo) {
                    this.photo_link_src = this.config.cover_photo;
                }
            });
    }

    store_app_title() {
        const app_title = this.i18n.tr("app-title");
        this.api.call_server_post("default/save_app_title", {
            app_title: app_title,
        });
    }

    checkIfLoggedIn() {
        return this.api
            .call_server("default/check_if_logged_in")
            .then((result) => {
                this.isLoggedIn = result.is_logged_in;
                this.id = result.user_id;
            });
    }

    login(loginData) {
        return this.api
            .call_server("default/login", loginData)
            .then((result) => {
                if (result.user_error) {
                    const msg = this.i18n.tr("user." + result.user_error);
                    throw result.user_error;
                }
                this.isLoggedIn = !result.unregistered;
                const keys = Object.keys(result.user);
                for (const key of keys) {
                    this[key] = result.user[key];
                }
            });
    }

    logout() {
        return this.api.call_server("default/logout").then((result) => {
            this.isLoggedIn = false;
            this.privileges = {};
            this.editing = false;
            this.id = -1;
        });
    }

    attempt_login(loginData) {
        return this.api
            .call_server("groups/attempt_login", { email: loginData.email })
            .then((response) => {
                this.id = response.user_id;
                if (this.id) {
                    this.isLoggedIn = true;
                }
                return response;
            });
    }

    reset_password(loginData) {
        return this.api.call_server("default/reset_password", {
            email: loginData.email,
            password: loginData.password,
        });
    }

    register(loginData) {
        return this.api
            .call_server_post("default/register_user", { user_info: loginData })
            .then((result) => {
                if (result.user_error) {
                    //const msg = this.i18n.tr("user." + result.user_error);
                    throw result.user_error;
                } else if (result.error) {
                    //const msg = result.error;
                    throw result.error;
                }
            });
    }

    get debugging() {
        return process.env.debug;
    }

    get advanced(): boolean {
        if (!this._advanced) {
            this._advanced = this.cookies.get("ADVANCED-USER");
            if (this._advanced == null) {
                this._advanced = "off";
                this.cookies.put("ADVANCED-USER", this._advanced);
            }
        }
        if (this.editing) return true;
        return this._advanced == "on";
    }

    set advanced(adv: boolean) {
        this._advanced = adv ? "on" : "off";
        this.cookies.put("ADVANCED-USER", this._advanced);
    }

    get advanced_user() {
        return this.advanced;
    }

    set_photo_link(photo_link_src, photo_id) {
        this.photo_link_src = photo_link_src;
        this.curr_photo_id = photo_id;
    }

    get_photo_link() {
        return this.photo_link_src;
    }

    get_curr_photo_id() {
        return this.curr_photo_id;
    }

    get_app_list() {
        this.api
            .call_server("gallery/apps_for_gallery", {
                developer: this.privileges.DEVELOPER,
                editing: this.editing,
            })
            .then((response) => {
                this.app_list = response.app_list;
            });
    }

    get active_app_list() {
        if (this.editing && this.privileges.ADMIN) return true;
        const lst = this.app_list.filter((app) => app.active);
        return lst.length > 0;
    }
}
