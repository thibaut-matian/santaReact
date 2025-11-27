export class SecurityUtils {
  
  
  static sanitize(input) {
    if (typeof input !== 'string') return input;
    return input
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }
  
  
  static isValidEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 254;
  }
  

  static isValidPassword(password) {
    return password && password.length >= 4 && password.length <= 100;
  }
  
  static escapeForUrl(str) {
    return encodeURIComponent(str);
  }
  
  static maskId(id) {
    return `***${String(id).slice(-3)}`;
  }
}