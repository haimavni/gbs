const max = 32;

export class FilterValueConverter {
  toView(array, value, ...properties) {
    value = (value || '').trim().toLowerCase();
    
    if (!value) {
      return array.slice(0, max);
    }
    let parts = value.split(" ");
    let arr = array.filter(item => 
      parts.every(part =>
      properties.some(property => 
        (item[property] || '').toLowerCase().includes(part)));
    arr = arr.slice(0, max);
    return arr;
  }
}