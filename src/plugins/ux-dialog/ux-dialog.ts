import { customElement } from "aurelia";

import './ux-styles.scss';

@customElement({
    name: 'ux-dialog',
    template: `<au-slot></au-slot>`
})
export class UxDialog {

}
