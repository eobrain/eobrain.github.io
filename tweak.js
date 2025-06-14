const nav = document.querySelector('nav')

let sep = ''

document.querySelectorAll('section > p:first-of-type > a:first-of-type').forEach(a => {
  const href = a.attributes.href.value
  const id = href.replace(/https:\/\/github.com\/eobrain\/(.*)$/, '$1')
  const section = a.parentElement.parentElement
  section.id = id

  nav.insertAdjacentHTML('beforeend', `${sep}<a href="#${id}">${id}</a>`)

  sep = ' | '
})
