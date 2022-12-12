/* global popularElement cuckooElement pinaforeElement customElement instanceElement */

function changeLinks () {
  const instance = document.location.hash.slice(1)
  const matches = document.querySelectorAll('a[data-popular]')
  matches.forEach(a => {
    const hostName = instance === 'POPULAR' ? a.dataset.popular : instance
    const path = hostName === 'cuckoo.social' ? '#/timelines/tag' : 'tags'
    a.href = a.href.replace(/https:\/\/.*\/tags\//, `https://${hostName}/${path}/`)
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

const cuckooCallback = () => {
  if (cuckooElement.checked) {
    document.location.hash = 'cuckoo.social'
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

const disabledCallback = () => {
  const instance = instanceElement.value.trim()
  customElement.disabled = !instance.match(/[a-z]\.[a-z]/)
  if (customElement.disabled && customElement.checked) {
    popularElement.checked = true
  }
}

popularElement.addEventListener('change', popularCallback)
pinaforeElement.addEventListener('change', pinaforeCallback)
cuckooElement.addEventListener('change', cuckooCallback)
customElement.addEventListener('change', customCallback)
instanceElement.addEventListener('change', customCallback)
instanceElement.addEventListener('change', disabledCallback)

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

disabledCallback()
