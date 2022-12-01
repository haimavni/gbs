import { IRouteableComponent } from '@aurelia/router';
export class MemberFaces implements IRouteableComponent {
    members = [];

    loading(members) {
        this.members = members;
    }
}
