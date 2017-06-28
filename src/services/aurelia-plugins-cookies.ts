export class Cookies {
  
  get(key) {
    let cookies = this.getAll();
    return cookies && cookies[key] ? cookies[key] : null;
  }

  public getAll() {
    return this._parse(document.cookie);
  }

  getObject(key) {
    let value = this.get(key);
    return value ? JSON.parse(value) : value;
  }

  put(key, value) {
    let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    let expires = options.expires;
    if (value == null) expires = 'Thu, 01 Jan 1970 00:00:01 GMT';
    if (typeof expires === 'string') expires = new Date(expires);
    let str = this._encode(key) + '=' + (value != null ? this._encode(value) : '');
    if (options.path) str += '; path=' + options.path;
    if (options.domain) str += '; domain=' + options.domain;
    if (options.expires) str += '; expires=' + expires.toUTCString();
    if (options.secure) str += '; secure';
    document.cookie = str;
  }

  putObject(key, value) {
    //let options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};

    this.put(key, JSON.stringify(value)); //, options);
  }

  remove(key) {
    //let options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};

    this.put(key, null); //, options);
  }

  removeAll() {
    let _this = this;

    let cookies = this.getAll();
    Object.keys(cookies).forEach(function (key) {
      return _this.remove(key);
    });
  }

  _decode(value) {
    try {
      return decodeURIComponent(value);
    } catch (e) {
      return null;
    }
  }

  _encode(value) {
    try {
      return encodeURIComponent(value);
    } catch (e) {
      return null;
    }
  }

  _parse(str) {
    let obj = {};
    let pairs = str.split(/ *; */);
    if (pairs[0] === '') return obj;
    for (let i = 0, j = pairs.length; i < j; i += 1) {
      let pair = pairs[i].split('=');
      obj[this._decode(pair[0])] = this._decode(pair[1]);
    }
    return obj;
  }

}