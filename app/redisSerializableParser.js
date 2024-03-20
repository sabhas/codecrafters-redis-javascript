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

const parseRequest = (request) => {
  // Check if request starts with '*', throw error if not
  if (request[0] != '*') {
    throw new Error('Invalid Request')
  }

  // Split the request into items and remove the last empty one
  const requestItems = request.split(/\r\n/).slice(undefined, -1)

  // Get the total number of commands expected
  const totalCommands = Number(requestItems[0].slice(1))

  // Separate and count the command lengths and actual commands
  const commandLength = requestItems.slice(1).filter((c) => c.startsWith('$'))
  const commandsList = requestItems.slice(1).filter((c) => !c.startsWith('$'))

  // Check if counts match, throw error if not
  if (
    totalCommands !== commandLength.length &&
    totalCommands !== commandsList.length
  ) {
    throw new Error('Invalid Number Of Arguments')
  }

  commandsList.forEach((command, idx) =>
    // Validate each command's length, throw error if mismatch
    isValidCommand(command, commandLength[idx])
  )
  return commandsList
}

/**
  The encodeSingleString function is a utility that takes a string as an argument
  and formats it according to the Redis Serialization Protocol (RESP) for simple strings.
  In RESP, simple strings are encoded with a leading plus sign (+), followed by the string itself,
  and terminated with CRLF (\r\n).
  This function constructs the formatted string by concatenating these elements together.
 */

const encodeSingleString = (str) => {
  return `+${str}\r\n`
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
  return `$${str.length}\r\n${str}\r\n`
}

module.exports = { encodeSingleString, encodeBulkString, parseRequest }
