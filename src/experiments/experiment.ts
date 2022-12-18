import { autoinject, singleton } from "aurelia-framework";
import { User } from "../services/user";
import { MemberGateway } from "../services/gateway";

@autoinject
@singleton()
export class Experiment {
    val: any;
    user: User;
    api;
    options = [
        { name: "No", value: false },
        { name: "Yes", value: true },
    ];
    int_options = [
        { name: "red", value: 1 },
        { name: "green", value: 2 },
        { name: "blue", value: 3 },
    ];
    bool_val = false;
    int_val = 99;
    date_val = "2022-12-08";
    color_code = 1;
    relation;
    has_relation = true;
    eventSource;
    incomming_messages = [];
    message_content = "";
    channel = "all";

    constructor(user: User, api: MemberGateway) {
        this.user = user;
        this.api = api;
    }

    handle_data_change(event) {
        let detail = event.detail;
        console.log("detail in experiment: ", detail);
    }

    created() {
        this.eventSource = new EventSource(
            `sse/subscribe?channel=${this.channel}`
        );
        this.eventSource.onmessage = (event) => this.handle_incoming_message(event);
        this.eventSource.onopen = (event) => {console.log("connection has been established ", event)}
        this.eventSource.onerror = (event) => {console.log("an error has occured ", event)}
    }

    tease_server() {
        this.api
            .call_server_post("sse/tease", {
                data: this.message_content,
                channel: this.channel,
            })
            .then((response) => (this.message_content = ""));
    }

    handle_incoming_message(event) {
        this.incomming_messages.push(event.data);
        console.log("message received ", event.data);
    }
}
