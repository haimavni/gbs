export class FilterValueConverter {
  toView(array, value, max=24, ...properties) {
    if (!array) {
      return [];
    }
    value = (value || '').trim().toLowerCase();
    
    if (!value) {
      return array.slice(0, max);
    }
    let parts = value.toLowerCase().split(" ");
    let arr = array.filter(item => 
      parts.every(part => properties.some(function(this, property, index, properties) {
        let p = (item[property] || "").toLowerCase();
        if (part.startsWith("[") || part.startsWith("]")) {
          p = part[0] + p;
        }
        if (part.endsWith("[") || part.endsWith("]")) {
          p = p + part[part.length-1]; 
        }
        return p.includes(part);
      })
      //properties.some(property => 
        //(item[property] || '').toLowerCase().includes(part))
        ));
    arr = arr.slice(0, max);
    return arr;
  }
}
