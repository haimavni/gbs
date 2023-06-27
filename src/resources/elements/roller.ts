import { IDialogService } from "@aurelia/dialog";
import { INode, bindable } from "aurelia";
import { IUser } from "../../services/user";

export class RollerCustomElement {
    @bindable option_list = [];
    @bindable current;
    @bindable width;
    @bindable maxlen: number;
    @bindable charWidth = 10;
    @bindable left;

    idx = 0;

    constructor(
        @INode private readonly element: HTMLElement,
        @IUser private readonly user: IUser,
        @IDialogService private readonly dialog: IDialogService
    ) {

    }

    shift(dif) {
        let i = this.idx + dif;
        if (i >= 0 && i < this.option_list.length) {
            this.idx = i;
            this.current = this.option_list[i];
        }
    }

    bound() {
        this.idx = this.option_list.indexOf(this.current);
        this.width = this.maxlen * this.charWidth + 2; //2 for the boundaries
        this.left = (this.width - 10) / 2;
    }
}
