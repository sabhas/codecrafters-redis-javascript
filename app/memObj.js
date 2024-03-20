/**
 *  A simple in-memory storage object memObj that will act as a key-value store.
 */
const memObj = {}

/**
 * It takes a key and a value as arguments, assigns the value to the key within memObj (in-memory storage object), and returns the string "OK"
 */
const setKeyInMap = (key, val) => {
  memObj[key] = val
  return 'OK'
}

/**
 * It retrieves the value associated with a given key from memObj (in-memory storage object).
 * If the key exists (checked using hasOwnProperty), it returns the corresponding value.
 * If the key does not exist, it returns -1, indicating a null value
 */
const getKeyFromMap = (key) => {
  if (memObj.hasOwnProperty(key)) {
    return memObj[key]
  }
  return -1
}

module.exports = { setKeyInMap, getKeyFromMap }
