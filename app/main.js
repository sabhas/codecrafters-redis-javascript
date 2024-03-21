const net = require('net')
const {
  encodeSingleString,
  encodeBulkString,
  parseRequest
} = require('./redisSerializableParser')
const { setKeyInMap, getKeyFromMap } = require('./memObj')
const { filterFlags, getSysInfo } = require('./utils')

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here:')

const parsedArguments = filterFlags(process.argv)

const getRedisInfo = () => {
  const sysInfo = getSysInfo(parsedArguments)
  const resp = Object.entries(sysInfo)
    .map(([key, val]) => {
      return encodeBulkString(`${key}:${val}`)
    })
    .join()
  console.log('Resp: ', resp)

  return resp
}

const handlers = {
  ping: () => encodeSingleString('PONG'),
  echo: (args) => args.map((str) => encodeBulkString(str)).join(),
  set: (args) => encodeSingleString(setKeyInMap(args)),
  get: (args) => encodeSingleString(getKeyFromMap(args[0])),
  info: () => encodeBulkString(getRedisInfo())
}

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (query) => {
    try {
      const parsedQuery = parseRequest(query)
      const command = parsedQuery[0]
      const args = parsedQuery.slice(1)
      const resp = handlers[command](args)
      connection.write(resp)
    } catch (e) {
      console.error(e)
      connection.write(e.message + '\r\n')
    }
  })
  connection.on('close', () => {
    console.log('Connection Closed: ')
    connection.end()
  })
})

const port = parsedArguments['port'] || 6379

server.listen(port, '127.0.0.1')
