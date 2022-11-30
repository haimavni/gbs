import { DI } from 'aurelia';
import * as Collections from 'typescript-collections';

export const ICache = DI.createInterface<ICache>('ICache', x => x.singleton(Cache));
export type ICache = Cache;

export class Cache {
    cacheStorage = new Collections.Dictionary<string, any>();

    setValue(key, data) {
        this.cacheStorage.setValue(key, data);
    }

    getValue(key) {
        return this.cacheStorage.getValue(key);
    }

    saveObject(key, obj) {
        this.setValue(key, obj)
    }

    loadOject(key, obj, keys?) {
        const other = this.getValue(key);

        if (!keys) {
            keys = Object.keys(other);
        } 
        for (const k of keys) {
            obj[k] = other[k]
        }
    }

}
