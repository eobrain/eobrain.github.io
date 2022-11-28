import PQueue from 'p-queue'
import smoothish from 'smoothish'
import fs from 'fs'
// import { pp } from 'passprint'

import iii from './instances.js'

const TOP_COUNT = 5

const instances = iii // .slice(1000, 1100)
instances.sort()

const queue = new PQueue({ concurrency: 100 })

let count = 0
const total = instances.length

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

function extractTld (domain) {
  const split = domain.split('.')
  return split[split.length - 1]
}

const hashtagMapAll = {}
const mapOfMaps = {}

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
        addToHashTagMap(hashtagMapAll, name, increase)

        const tld = extractTld(instance)
        if (!tld.match(/^[a-z][a-z]+/)) {
          continue // invalid TLD
        }
        if (tld in mapOfMaps) {
          addToHashTagMap(mapOfMaps[tld].hashtagMap, name, increase)
        } else {
          mapOfMaps[tld] = {
            tld,
            hashtagMap: { [name]: { name, increase } }
          }
        }

        const count = history[0].uses
        for (const hashtagMap of [hashtagMapAll, mapOfMaps[tld].hashtagMap]) {
          if ('count' in hashtagMap[name]) {
            if (count > hashtagMap[name].count) {
              hashtagMap[name].instance = instance
              hashtagMap[name].count = count
            }
          } else {
            hashtagMap[name].instance = instance
            hashtagMap[name].count = count
          }
        }
      }
    } catch (e) {
    }
  })
  promises.push(promise)
}

await Promise.all(promises)

function printHashtags (tld, hashtagList) {
  fs.writeFile(`tld/${tld}.json`, JSON.stringify(
    {
      date: Date.now(),
      total: hashtagList.length,
      all: hashtagList
    }), err => err && console.error(err))
}

function printTop (tld, hashtagMap) {
  const hashtagList = Object.values(hashtagMap)
  hashtagList.sort((a, b) => b.increase - a.increase)

  printHashtags(tld, hashtagList.slice(0, TOP_COUNT))
}

function printAll (hashtagMap) {
  const hashtagList = Object.values(hashtagMap)
  hashtagList.sort((a, b) => b.count - a.count)
  printHashtags('ALL', hashtagList)
}

printTop('TOTAL', hashtagMapAll)

printAll(hashtagMapAll)

const hashtagCount = dict => Object.keys(dict.hashtagMap).length

const listOfMaps = Object.values(mapOfMaps)
listOfMaps.sort((a, b) => hashtagCount(b) - hashtagCount(a))

const rows = listOfMaps.map(dict => `{tld:"${dict.tld}",hashtagCount:${hashtagCount(dict)}}`).join(',\n')
fs.writeFile(
  'tld.js', `
export default [
 ${rows}
]
`, err => err && console.error(err)
)

for (const dict of listOfMaps) {
  printTop(dict.tld, dict.hashtagMap)
}
