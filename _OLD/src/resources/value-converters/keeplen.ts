export class KeeplenValueConverter {
    toView(array, obj) {
        if (!array) {
            array = [];
        }
        obj.len = array.length;
        return array;
    }
}
