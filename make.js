import tldInfos from './tld.js'
import { a, section, p } from 'ez-html-elements'
import { element } from 'ez-html-elements/base.js'
import fs from 'fs'
import { readFile } from 'node:fs/promises'
// import { pp } from 'passprint'

const tNewthought = element('t-newthought')

// const blackPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function readJson (jsonFile) {
  const bytes = await readFile(jsonFile, { encoding: 'utf8' })
  try {
    return JSON.parse(bytes)
  } catch (e) {
    console.error({ jsonFile, bytes, e })
  }
}

async function writeHtml (jsonFile, header) {
  const json = await readJson(jsonFile)
  const all = json.all
  // const max = all[0].increase
  const hashtagLinks = []
  for (let i = 0; i < all.length; ++i) {
    const { name, instance } = all[i]
    if (!instance) {
      console.error('No instance.', { jsonFile, i, name })
      continue
    }
    // const style = `height:1em;width:${20 * increase / max}vw`
    hashtagLinks.push(a(
      { href: `https://${instance}/tags/${name}`, 'data-popular': instance },
      '#' + name
    ))
  }
  const html = p(tNewthought(header), ...hashtagLinks)
  const htmlFile = jsonFile.replace(/\.json$/, '.html')
  fs.writeFile(htmlFile, html, (err) => err && console.error(err))
}

let contentHtml = section({
  'hx-get': 'tld/TOTAL.html',
  'hx-trigger': 'intersect once'
})

writeHtml('tld/TOTAL.json', 'All Instances')
for (const { tld } of tldInfos) {
  writeHtml(`tld/${tld}.json`, `*.${tld} Instances`)
  contentHtml += section({
    'hx-get': `tld/${tld}.html`,
    'hx-trigger': 'intersect once'
  })
}
writeHtml('tld/ALL.json', 'Active Hashtags')
fs.writeFile('content.html', contentHtml, (err) => err && console.error(err))

const hashtagHtml = (hashtagList) =>
  hashtagList.map((name) => '#' + name).join(' ')

async function writeInstances () {
  const distances = await readJson('distances.json')
  const instances = distances.map((x) =>
    p(
      a({ href: `https://${x.instance}` }, x.instance),
      hashtagHtml(x.hashtagList)
    )
  )
  const distancesHtml = instances.join('')
  fs.writeFile(
    'distances.html',
    distancesHtml,
    (err) => err && console.error(err)
  )
}

writeInstances()
