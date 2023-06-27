import { DI } from 'aurelia';
import * as JsonHuman from 'json.human';

export type IHumanJson = HumanJson;
export const IHumanJson = DI.createInterface<IHumanJson>("IHumanJson", (x) =>
    x.singleton(HumanJson)
);

export class HumanJson {

    display(obj) {
        let node = JsonHuman.format(obj);
        return node;
    }
}
