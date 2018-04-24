export class FilterValueConverter {
    toView(array, value, ...properties) {
        if (!array || array.length == 0) {
            return [];
        }
        if (array.ignore) {
            return array.arr;
        }
        value = (value || '').trim().toLowerCase();

        let array0 = [];
        if (properties[0].charAt(0) == '*') {
            let p0 = properties[0].slice(1);
            properties.splice(0, 1);
            array0 = array.filter(item => item[p0]);
            array = array.filter(item => !item[p0]);
            if (!value) {
                return array0.concat(array);
            }
        }
        if (!value) {
            return array;
        }
        value = value.replace(/[-().,]/g, '')
        let parts = value.toLowerCase().split(" ");
        //parts = parts.filter(s => s != '-' && s != '(' && s != ')');
        let arr = array.filter(item =>
            parts.every(part => properties.some(function (this, property, index, properties) {
                let p = (item[property] || "").toLowerCase();
                if (part.startsWith("[") || part.startsWith("]")) {
                    p = part[0] + p;
                }
                if (part.endsWith("[") || part.endsWith("]")) {
                    p = p + part[part.length - 1];
                }
                return p.includes(part);
            }) //some
            ) //every
        ); //filter
        arr = arr.slice(0);
        arr = array0.concat(arr);
        return arr;
    }
}
