import { label, input, span } from './ez-html-elements/index.js'

/* global HTMLElement customElements */

let nextId = 0

class TufteSidenote extends HTMLElement {
  connectedCallback () {
    const id = `id${nextId++}`
    this.innerHTML =
      label({ for: id }, ['margin-toggle', 'sidenote-number']) +
      input({ type: 'checkbox', id }, ['margin-toggle']) +
      span(['sidenote'], this.innerHTML)
  }
}

class TufteMarginnote extends HTMLElement {
  connectedCallback () {
    const id = `id${nextId++}`
    this.innerHTML =
      label({ for: id }, ['margin-toggle'], '&#8853;') +
      input({ type: 'checkbox', id }, ['margin-toggle']) +
      span(['marginnote'], this.innerHTML)
  }
}
class TufteNewThought extends HTMLElement {
  connectedCallback () {
    this.innerHTML = span(['newthought'], this.innerHTML)
  }
}

customElements.define('t-marginnote', TufteMarginnote)
customElements.define('t-newthought', TufteNewThought)
customElements.define('t-sidenote', TufteSidenote)
