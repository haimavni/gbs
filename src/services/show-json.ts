import { DI } from 'aurelia';
import * as JsonHuman from 'json.human';

export const IHumanJson = DI.createInterface<IHumanJson>('IHumanJson', x => x.singleton(HumanJson));
export type IHumanJson = HumanJson;

export class HumanJson {

    display(obj) {
        const node = JsonHuman.format(obj);

        return node;
    }
}
