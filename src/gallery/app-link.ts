import { IMemberGateway } from "../services/gateway";

export class AppLink {
    params = {
        host: "",
        app: "",
        app_name: "",
        app_description: "",
        logo_path: "",
        cover_photo: "",
        allow_publishing: false,
        active: false,
    };

    constructor(@IMemberGateway readonly api: IMemberGateway) {

    }

    loading(params) {
        this.params = params;
    }

    set_app_activity() {
        this.api.call_server_post("gallery/modify_app_state", {
            active: this.params.active,
            app: this.params.app,
        });
    }
}
