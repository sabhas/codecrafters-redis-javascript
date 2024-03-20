const isValidCommand = (command, commandLength) => {
  if (!commandLength.startsWith('$')) throw new Error('Incorrect Length')
  const commandLen = Number(commandLength.slice(1))
  if (command.length !== commandLen) throw new Error('Incorrect Element Length')
  1
}

const parseRequest = (request) => {
  if (request[0] != '*') {
    throw new Error('Invalid Request')
  }
  const requestItems = request.split(/\r\n/).slice(undefined, -1)
  const totalCommands = Number(requestItems[0].slice(1))
  const commandLength = requestItems.slice(1).filter((c) => c.startsWith('$'))
  const commandsList = requestItems.slice(1).filter((c) => !c.startsWith('$'))
  if (
    totalCommands !== commandLength.length &&
    totalCommands !== commandsList.length
  ) {
    throw new Error('Invalid Number Of Arguments')
  }
  commandsList.forEach((command, idx) =>
    isValidCommand(command, commandLength[idx])
  )
  return commandsList
  1
}

const encodeSingleString = (str) => {
  return `+${str}\r\n`
}

const encodeBulkString = (str) => {
  1
  return `$${str.length}\r\n${str}\r\n`
}

module.exports = { encodeSingleString, encodeBulkString, parseRequest }
