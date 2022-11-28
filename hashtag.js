import PQueue from 'p-queue'
import smoothish from 'smoothish'
import fs from 'fs'
// import { pp } from 'passprint'

import iii from './instances.js'

const TOP_COUNT = 5

const instances = iii // .slice(2000, 2100)
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

const instancesMap = {}
const allMap = {}

const sum = xs => xs.reduce((acc, x) => acc + x)

function addInstancesMap (instance, name, totalUses) {
  if (instance in instancesMap) {
    instancesMap[instance][name] = totalUses
  } else {
    instancesMap[instance] = { [name]: totalUses }
  }
  if (name in allMap) {
    allMap[name] += totalUses
  } else {
    allMap[name] = totalUses
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
        addToHashTagMap(hashtagMapAll, name, increase)
        addInstancesMap(instance, name, sum(usesArray))

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

const magnitude = hashCounts => Math.sqrt(sum(Object.values(hashCounts).map(x => x * x)))
const allMapMagnitude = magnitude(allMap)

const instanceMagnitudes = {}
for (const instance in instancesMap) {
  instanceMagnitudes[instance] = magnitude(instancesMap[instance])
}

function cosineSimilarity (instance) {
  // dot product of all by instance divided by magnitudes
  const instanceHashCounts = instancesMap[instance]
  const instanceMagnitude = instanceMagnitudes[instance]
  let dotProduct = 0
  for (const name in instanceHashCounts) {
    dotProduct += instanceHashCounts[name] * allMap[name]
  }
  return dotProduct / (instanceMagnitude * allMapMagnitude)
}

function notableHashtags (instance) {
  const instanceHashCounts = instancesMap[instance]
  const hashtags = Object.keys(instanceHashCounts).map(name => ({
    name,
    value: (instanceHashCounts[name] / instanceMagnitudes[instance]) /
    (allMap[name] / allMapMagnitude)
  }))
  return hashtags.sort((a, b) => b.value - a.value).slice(0, 2).map(x => x.name)
}

function printInstanceDistance () {
  const distances = Object.keys(instancesMap).map(instance => ({
    instance,
    distance: cosineSimilarity(instance),
    hashtagList: notableHashtags(instance)
  })).sort((a, b) => a.distance - b.distance)

  fs.writeFile('distances.json', JSON.stringify(distances), err => err && console.error(err))
}

printInstanceDistance()
