// File: /js/core/dom.js
// Safe DOM helpers to eliminate innerHTML injection vulnerabilities & properly render SVGs

export function el(tag, attributes = {}, ...children) {
  const element = document.createElement(tag);
  
  for (const [key, val] of Object.entries(attributes)) {
    if (key.startsWith('on') && typeof val === 'function') {
      element.addEventListener(key.substring(2).toLowerCase(), val);
    } else if (key === 'className') {
      element.className = val;
    } else if (key === 'html') {
      element.innerHTML = val;
    } else if (key === 'dataset') {
      for (const [dKey, dVal] of Object.entries(val)) {
        element.dataset[dKey] = dVal;
      }
    } else if (val !== false && val !== null && val !== undefined) {
      element.setAttribute(key, val);
    }
  }

  for (const child of children.flat()) {
    if (child === null || child === undefined || child === false) continue;
    if (typeof child === 'string' || typeof child === 'number') {
      element.appendChild(document.createTextNode(String(child)));
    } else if (child instanceof Node) {
      element.appendChild(child);
    }
  }

  return element;
}

export function clearChildren(parent) {
  while (parent.firstChild) {
    parent.removeChild(parent.firstChild);
  }
}
