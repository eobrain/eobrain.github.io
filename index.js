/* global popularElement pinaforeElement customElement instanceElement */

function changeLinks () {
  const instance = document.location.hash.slice(1)
  const matches = document.querySelectorAll('a[data-popular]')
  matches.forEach(a => {
    const hostName = instance === 'POPULAR' ? a.dataset.popular : instance
    a.href = a.href.replace(/https:\/\/.*\/tags\//, `https://${hostName}/tags/`)
    a.nextElementSibling.innerHTML = `on ${hostName}`
  })
}

const popularCallback = () => {
  if (popularElement.checked) {
    document.location.hash = 'POPULAR'
  }
  changeLinks()
}

const pinaforeCallback = () => {
  if (pinaforeElement.checked) {
    document.location.hash = 'pinafore.social'
  }
  changeLinks()
}

const customCallback = () => {
  const instance = instanceElement.value.trim()
  if (customElement.checked && instance !== '') {
    document.location.hash = instance
  }
  changeLinks()
}

popularElement.addEventListener('change', popularCallback)
pinaforeElement.addEventListener('change', pinaforeCallback)
customElement.addEventListener('change', customCallback)
instanceElement.addEventListener('change', customCallback)

switch (document.location.hash) {
  case '#POPULAR':
  case '#':
  case '':
    popularElement.checked = true
    popularCallback()
    break
  case '#pinafore.social':
    pinaforeElement.checked = true
    pinaforeCallback()
    break
  default:
    customElement.checked = true
    instanceElement.value = document.location.hash.slice(1)
    customCallback()
    break
}
