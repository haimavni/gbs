import { ITheme } from "../services/theme";
import { IMemberGateway } from "../services/gateway";

export class ShowFeedbacks {
    items = [];
    pageSize = 15;

    constructor(@ITheme private readonly theme: ITheme, @IMemberGateway private readonly api: IMemberGateway) {

    }

    attached() {
        this.theme.display_header_background = true;
        this.theme.hide_title = true;
        this.theme.hide_menu = true;
        this.theme.page_title = "User Feedbacks";
        this.get_feedbacks();
    }

    get_feedbacks() {
        this.api.call_server("default/get_feedbacks").then((response) => {
            this.items = response.feedbacks;
            for (let itm of this.items) {
                if (itm.message)
                    itm.message = itm.message.replace("\n", "<br>");
            }
        });
    }
}
