import * as Collections from 'typescript-collections';
import { autoinject, singleton, noView } from "aurelia-framework";

@autoinject()
@singleton()
@noView()
export class Cache {

    constructor () {

    }

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
        let other = this.getValue(key);
        if (!keys) {
            keys = Object.keys(other);
        } 
        for (let k of keys) {
            obj[k] = other[k]
        }
    }

}