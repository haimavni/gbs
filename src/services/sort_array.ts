export function sort_array(array, properties) {
    if (!array || !properties)
        return array;
    properties = properties.split(";");
    const retvalue = array.sort((a, b) => {
        for (let property of properties) {
            let factor = 1
            if (property.charAt(0) == "-") {
                property = property.slice(1);
                factor = -1;
            }
            const textA = a[property];
            const textB = b[property];
            if (textA < textB) {
                return -factor;
            } else if (textA > textB) {
                return factor;
            }
        }
        return 0;
    });
    return retvalue;
}
