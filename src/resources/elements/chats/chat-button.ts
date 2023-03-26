import { IUser } from "../../../services/user";
import { Chat } from "../../../user/chat";
import { bindable, BindingMode, INode } from "aurelia";
import { IDialogService } from '@aurelia/dialog';

export class ChatButtonCustomElement {
    @bindable({ mode: BindingMode.twoWay }) chatroom_id;
    @bindable caption = "user.chats";

    constructor(
        @INode readonly element: HTMLElement,
        @IUser readonly user: IUser,
        @IDialogService readonly dialog: IDialogService
    ) {}

    get can_chat() {
        return true; //this.user.isLoggedIn || this.chatroom_id;
    }

    get empty_class() {
        const result = this.chatroom_id ? "" : "empty";
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
            .whenClosed((result: any) => {
                document.body.classList.remove("edged-dialog");
                if (result.output == "deleted") {
                    this.dispatch_chatroom_deleted_event();
                }
            });
    }

    dispatch_new_chatroom_event() {
        const customEvent = new CustomEvent("new-chatroom", {
            detail: {
                new_name: "new chatroom",
            },
            bubbles: true,
        });
        this.element.dispatchEvent(customEvent);
    }

    dispatch_chatroom_deleted_event() {
        const customEvent = new CustomEvent("chatroom-deleted", {
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
