import PQueue from 'p-queue'
import smoothish from 'smoothish'
import iii from './instances.js'

const TOP_COUNT = 50

const instances = iii.slice(1000, 1100)
instances.sort()

const queue = new PQueue({ concurrency: 100 })

let count = 0
const total = instances.length

const hashtagMap = {}
// const DAY = 24 * 60 * 60
// const today = Math.trunc(Date.now() / (DAY * 1000)) * DAY

const promises = []

function addToHashTagMap (hashtagMap, name, increase) {
  if (name in hashtagMap) {
    const entry = hashtagMap[name]
    entry.increase += increase
  } else {
    hashtagMap[name] = { name, increase }
  }
}

for (const instance of instances) {
  const promise = queue.add(async () => {
    console.error(`${Math.round(100 * count / total)}% ${instance}`)
    ++count

    try {
      const resultPromise = fetch(`https://${instance}/api/v1/trends/tags?limit=100`)

      const result = await resultPromise
      const hashtags = await result.json()
      for (let { name, history } of hashtags) {
        name = name.toLowerCase()
        const usesArray = history.slice(1).map(h => h.uses)
        const smoothed = smoothish(usesArray)
        const increase = smoothed[0] - smoothed[1]
        addToHashTagMap(hashtagMap, name, increase)
      }
    } catch (e) {
    }
  })
  promises.push(promise)
}

await Promise.all(promises)

const hashtagList = Object.values(hashtagMap)
hashtagList.sort((a, b) => b.increase - a.increase)

const rows = hashtagList.slice(0, TOP_COUNT).map(row =>
    `{ name: '${row.name}', increase: ${row.increase} },`).join('\n')
console.log(`
  export default {
    date: ${Date.now()},
    all: [
      ${rows}
    ]
  }      `)
