import trending from './trending.js'
import { tr, td, a, img } from 'ez-html-elements'

const blackPixel = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+A8AAQUBAScY42YAAAAASUVORK5CYII='

async function wikipedia (name) {
  try {
    const result = await fetch(`https://en.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&srlimit=20&srsearch=${name}`)
    const json = await result.json()
    return json.query.search[0].title
  } catch (e) {
    return ''
  }
}

const all = trending.all
const max = all[0].increase
for (let i = 0; i < all.length; ++i) {
  const { name, increase } = all[i]
  const style = `height:1em;width:${20 * increase / max}vw`
  const row = tr(
    td(`${i}`),
    td(
      img({ src: blackPixel, style })),
    td(a(
      { href: `https://pinafore.social/tags/${name}` },
      name
    ),
    td(await wikipedia(name))))
  console.log(row)
}
