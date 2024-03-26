const { CRLF, FLAG } = require('./constants')
const {
  encodeBulkString,
  encodeSingleString,
  encodeArray
} = require('./redisSerializableParser')

const getRole = (args) => (args.includes(FLAG.REPLICA) ? 'slave' : 'master')

const getPort = (args, init = 6379) => {
  const portIndex = args.indexOf(FLAG.PORT)
  if (portIndex === -1) {
    return init
  }
  return args[portIndex + 1]
}

const getReplica = (args) => {
  const replicaIndex = args.indexOf(FLAG.REPLICA)
  if (replicaIndex === -1) {
    return null
  }
  return {
    masterHost: args[replicaIndex + 1],
    masterPort: args[replicaIndex + 2]
  }
}

const getSysInfo = (args) => {
  return {
    role: args.includes(FLAG.REPLICA) ? 'slave' : 'master',
    connected_slaves: 0,
    master_replid: '8371b4fb1155b71f4a04d3e1bc3e18c4a990aeeb',
    master_repl_offset: 0
  }
}

const getRedisInfo = (args) => {
  const sysInfo = getSysInfo(args)
  const resp = Object.entries(sysInfo)
    .map(([key, val]) => {
      return encodeBulkString(`${key}:${val}`)
    })
    .join()

  return resp
}

const parseEvents = (data) => {
  const events = []

  const lines = data.split(CRLF)

  // Check if the last element is blank
  if (lines[lines.length - 1] === '') {
    // Remove the last element
    lines.pop()
  }

  let index = 0

  while (index < lines.length) {
    const line = lines[index]

    const commandTypePrefix = line[0]

    switch (commandTypePrefix) {
      case '+': {
        events.push({
          type: 'simpleString',
          command: line.substr(1)
        })
        index++
        break
      }

      case '$': {
        const lengthOfString = Number.parseInt(line.substr(1)) - 1
        const extractedString = lines[index + 1].substr(0, lengthOfString)
        events.push({
          type: 'bulkString',
          command: extractedString
        })

        const remainderOfLine = lines[index + 1].length - lengthOfString

        if (remainderOfLine > 0) {
          const remainderOfCommandLine = lines[index + 1].substr(lengthOfString)

          lines.splice(index + 2, 0, remainderOfCommandLine)
        }

        index += 2
        break
      }

      case '*': {
        const numberOfEntries = Number.parseInt(line.substr(1))

        const entries = []
        for (let entryIndex = 0; entryIndex < numberOfEntries; entryIndex++) {
          const entry = lines[entryIndex * 2 + 2 + index]
          entries.push(entry)
        }
        events.push({
          type: 'bulkArray',
          command: entries
        })

        index += 1 + numberOfEntries * 2
        break
      }

      default: {
        throw new Error('Invalid command')
      }
    }
  }

  return events
}

const getEventSize = (event) => {
  if (event.type === 'simpleString') {
    return encodeSingleString(event.command).length
  }

  if (event.type === 'bulkString') {
    return encodeBulkString(event.command).length
  }

  if (event.type === 'bulkArray') {
    return encodeArray(event.command).length
  }

  return 0
}

module.exports = {
  getPort,
  getReplica,
  getRole,
  getSysInfo,
  getRedisInfo,
  parseEvents,
  getEventSize
}
