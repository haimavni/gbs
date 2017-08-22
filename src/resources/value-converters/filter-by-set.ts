export class FilterBySetValueConverter {
    toView(array, value) {
        if (!array) {
            return [];
        }
        if (! value) {
            return array;
        }
        let arr = array.filter(option => !value.has(option.name));
        return arr;
    }
}
