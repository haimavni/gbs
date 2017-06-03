const max = 32;

export class FilterValueConverter {
  toView(array, value, ...properties) {
    value = (value || '').trim().toLowerCase();
    
    if (!value) {
      return array.slice(0, max);
    }
    let arr = array.filter(item => 
      properties.some(property => 
        (item[property] || '').toLowerCase().includes(value)));
    arr = arr.slice(0, max);
    return arr;
  }
}