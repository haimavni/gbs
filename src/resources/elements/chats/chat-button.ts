import { IUser } from "../../../services/user";
import { DialogDeactivationStatuses, IDialogService } from "@aurelia/dialog";
import { Chat } from "../../../user/chat";
import { BindingMode, INode, bindable } from "aurelia";
import { watch } from '@aurelia/runtime-html';

export class ChatButtonCustomElement {
    @bindable({ mode: BindingMode.twoWay }) chatroom_id;
    @bindable caption = "user.chats";

    constructor(
        @INode private readonly element: HTMLElement,
        @IUser private readonly user: IUser,
        @IDialogService private readonly dialog: IDialogService
    ) {

    }

    @watch("user.config.show_chat_buttons")
    get can_chat() {
        return this.user.config.show_chat_buttons;
    }

    @watch("chatroom_id")
    get empty_class() {
        let result = this.chatroom_id ? "" : "empty";
        return this.chatroom_id ? "" : "empty";
    }

    async chat(event) {
        event.stopPropagation();
        let n = 0;
        if (!this.chatroom_id) {
            this.dispatch_new_chatroom_event();
            while (!this.chatroom_id && n < 50) {
                await sleep(100);
                n += 1;
            }
        }
        if (!this.chatroom_id) return;
        document.body.classList.add("edged-dialog");
        this.dialog
            .open({
                component: () => Chat,
                model: { chatroom_id: this.chatroom_id },
                lock: false,
            })
            .whenClosed((result) => {
                document.body.classList.remove("edged-dialog");

                if ((result.value as any).status === 'deleted') {
                    this.dispatch_chatroom_deleted_event();
                }
            });
    }

    dispatch_new_chatroom_event() {
        let customEvent = new CustomEvent("new-chatroom", {
            detail: {
                new_name: "new chatroom",
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    dispatch_chatroom_deleted_event() {
        let customEvent = new CustomEvent("chatroom-deleted", {
            detail: {
                chatroom_id: this.chatroom_id,
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }
}

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
