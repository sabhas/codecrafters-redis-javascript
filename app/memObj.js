/**
 *  A simple in-memory storage object memObj that will act as a key-value store.
 */
const memObj = {}

/**
 * It accept an array of arguments, assigns the value to the key within memObj (in-memory storage object), and returns the string "OK"
 *
 * If the third argument is present and equals 'px' (case-insensitive), it sets a ttl (time to live) property on the object.
 * This ttl is calculated by adding the current timestamp (Date.now()) to the provided expiry time in milliseconds (converted from a string to a number).
 */
const setKeyInMap = (args) => {
  memObj[args[0]] = {
    val: args[1]
  }
  if (args[2] && args[2].toLowerCase() == 'px') {
    memObj[args[0]]['ttl'] = Date.now() + Number(args[3])
  }

  return 'OK'
}

/**
 * It retrieves the value associated with a given key from memObj (in-memory storage object).
 * If the key exists (checked using hasOwnProperty), it returns the corresponding value.
 * If the key does not exist, it returns null value
 *
 * Further if the key exists and has an associated expiry time (ttl) it calculates the difference between the current time and the expiry time.
 * If the key has not yet expired (diff >= 0), it returns the value.
 * If the key has expired, it returns null to indicate that the key is no longer available.
 */
const getKeyFromMap = (key) => {
  if (memObj.hasOwnProperty(key)) {
    const val = memObj[key]['val']

    if (memObj[key]['ttl']) {
      const curTime = Date.now()
      const diff = memObj[key]['ttl'] - curTime

      if (diff >= 0) {
        return val
      }

      return null
    }

    return val
  }
  return null
}

module.exports = { setKeyInMap, getKeyFromMap }
