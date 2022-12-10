import { WritableStream } from 'htmlparser2/lib/WritableStream'
import * as fs from 'node:fs'

if (process.argv.length !== 3) {
  throw new Error(`Got ${process.argv.length} arguments, expected 3. ${process.argv}`)
}

let textIsInstanceName = false
const parserStream = new WritableStream({
  onopentag (tagname, attributes) {
    textIsInstanceName = tagname === 'a' && attributes.class === 'url'
  },
  ontext (text) {
    if (!textIsInstanceName) {
      return
    }
    text = text.trim()
    if (text === '') {
      return
    }
    console.log(`"${text}",`)
  },
  onclosetag (tagname) {
  }
})

console.log('export default [')
const htmlStream = fs.createReadStream(process.argv[2])
htmlStream.pipe(parserStream).on('finish', () => console.log(']'))
