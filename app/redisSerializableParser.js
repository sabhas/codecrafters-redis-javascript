const { CRLF } = require('./constants')

/**
  This function checks if a command from the Redis protocol is valid. 
  It takes two parameters: command, which is the actual command string, and commandLength,
  which is the expected length of the command prefixed with a dollar sign ($).

  The function first checks if commandLength starts with a $. 
  If not, it throws an error indicating that the length is incorrect.

  Then, it extracts the numeric part of commandLength by slicing off the $ and converts it to a number.
  It compares this number with the actual length of the command.
  If they don't match, it throws another error indicating that the element length is incorrect.
 */
const isValidCommand = (command, commandLength) => {
  if (!commandLength.startsWith('$')) throw new Error('Incorrect Length')
  const commandLen = Number(commandLength.slice(1))
  if (command.length !== commandLen) throw new Error('Incorrect Element Length')
}

/**
  The encodeSingleString function is a utility that takes a string as an argument
  and formats it according to the Redis Serialization Protocol (RESP) for simple strings.
  In RESP, simple strings are encoded with a leading plus sign (+), followed by the string itself,
  and terminated with CRLF (\r\n).
  This function constructs the formatted string by concatenating these elements together.
 */

const encodeSingleString = (str) => {
  //  If the input is null, the function now returns a special string "$-1\r\n", which is the Redis protocol's way of representing a null bulk string.
  if (str === null) return `$-1${CRLF}`
  return `+${str}${CRLF}`
}

/**
  This function takes a single argument str, which is the string to be encoded.
  The function returns a formatted bulk string according to the Redis Serialization Protocol (RESP).
  In RESP, a bulk string is encoded with a dollar sign $ followed by the length of the string, 
  a carriage return and line feed \r\n, the string itself, and another carriage return and line feed.

  Here's how the function works:

  * It starts by returning a string that begins with $ to indicate the start of a bulk string.
  * It then appends the length of the input string str.length, which tells the parser how many bytes to expect for the string value.
  * After the length, it adds \r\n to separate the length from the actual string content.
  * Next, it includes the string str itself.
  * Finally, it appends another \r\n to mark the end of the bulk string.

  This function is essential for encoding data in a way that a Redis client or server can correctly interpret as part of the communication protocol.
*/
const encodeBulkString = (str) => {
  return `$${str.length}${CRLF}${str}${CRLF}`
}

/**
  It takes an array of strings as input and processes each string to create a bulk string,
  which includes the length of the string, the string itself, and the appropriate terminators (\r\n).
  
  These bulk strings are then joined together with \r\n.
  
  The function also prefixes the output with an asterisk * followed by the number of items in the array and \r\n,
  which is the RESP format for the beginning of an array.
  
  The resulting string represents the entire array encoded as per RESP.
 */
const encodeArray = (data) => {
  const payload = data.map((line) => `$${line.length}${CRLF}${line}`).join(CRLF)
  return `*${data.length}${CRLF}${payload}${CRLF}`
}

module.exports = {
  encodeSingleString,
  encodeBulkString,
  encodeArray
}
