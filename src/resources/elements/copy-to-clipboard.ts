import { bindable, autoinject, singleton, bindingMode } from 'aurelia-framework';
import { User } from '../../services/user';

@autoinject()
@singleton()
export class CopyToClipboardCustomElement {
    @bindable content;
    user;

    constructor(user: User) {
        this.user = user;
    }

    copy_to_clipboard(event) {
        console.log("content: ", this.content);
        const hiddenElement: HTMLTextAreaElement = document.createElement('textarea');
        hiddenElement.style.display = 'none !important;';
        hiddenElement.innerText = this.content;

        document.body.appendChild(hiddenElement);
        hiddenElement.select();

        document.execCommand('SelectAll');
        document.execCommand('Copy');

        document.body.removeChild(hiddenElement);
    }

}