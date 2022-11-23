import tldInfos from './tld.js'
import { tr, td, a, img, article, h2, table } from 'ez-html-elements'
import fs from 'fs'
import { readFile } from 'node:fs/promises'
//import { pp } from 'passprint'

const blackPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

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
  const max = all[0].increase
  let rows = ''
  for (let i = 0; i < all.length; ++i) {
    const { name, increase } = all[i]
    const style = `height:1em;width:${20 * increase / max}vw`
    const row = tr(
      td(`${i + 1}`),
      td(
        img({ src: blackPixel, style })),
      td(a(
        { href: `https://pinafore.social/tags/${name}` },
        name
      )))
    rows += row
  }
  const html = h2(header) + table(rows)
  const htmlFile = jsonFile.replace(/\.json$/, '.html')
  fs.writeFile(htmlFile, html, err => err && console.error(err))
}

let contentHtml = article({ 'hx-get': 'tld/TOTAL.html', 'hx-trigger': 'load' })

writeHtml('tld/TOTAL.json', 'All Instances')
for (const { tld } of tldInfos) {
  writeHtml(`tld/${tld}.json`, `*.${tld} Instances`)
  contentHtml += article({ 'hx-get': `tld/${tld}.html`, 'hx-trigger': 'load' })
}
fs.writeFile('content.html', contentHtml, err => err && console.error(err))
