const net = require('net')
const {
  encodeSingleString,
  encodeBulkString,
  parseRequest,
  encodeArray
} = require('./redisSerializableParser')
const { setKeyInMap, getKeyFromMap } = require('./memObj')
const { getSysInfo, getPort, getReplica } = require('./utils')
const { CRLF } = require('./constants')

// You can use print statements as follows for debugging, they'll be visible when running tests.
console.log('Logs from your program will appear here:')

const getRedisInfo = () => {
  const sysInfo = getSysInfo(process.argv)
  const resp = Object.entries(sysInfo)
    .map(([key, val]) => {
      return encodeBulkString(`${key}:${val}`)
    })
    .join()
  console.log('Resp: ', resp)

  return resp
}

/**
  It is responsible for establishing a connection to the master server
  and sending the initial PING command as part of the handshake process.

  Here's a breakdown of what's happening:

  performHandshake is a function that takes host and port as arguments,
  representing the master server's address and port.
  Inside the function, net.createConnection is used to create a new TCP connection to the specified host and port.
  When the connection is successfully established, a message is logged to the console confirming the connection.
  Once connected, the client.write method sends a PING command to the master server.
  The PING command is encoded as a RESP Array using the encodeArray function,
  which is then written to the connection stream.
 */
const performHandshake = (host, port, listeningPort) => {
  const client = net.createConnection({ host, port }, () => {
    console.log(`Replica connected to master: ${host}:${port}`)
  })

  client.write(encodeArray(['ping']))
  client.write(
    encodeArray(['REPLCONF', 'listening-port', listeningPort.toString()])
  )
  client.write(encodeArray(['REPLCONF', 'capa', 'psync2']))
  client.write(encodeArray(['PSYNC', '?', '-1']))
}

const handlers = {
  ping: () => encodeSingleString('PONG'),
  echo: (args) => args.map((str) => encodeBulkString(str)).join(),
  set: (args) => encodeSingleString(setKeyInMap(args)),
  get: (args) => encodeSingleString(getKeyFromMap(args[0])),
  info: () => encodeBulkString(getRedisInfo()),
  replconf: () => encodeSingleString('OK'),
  psync: () => {
    const sysInfo = getSysInfo(process.argv)
    return encodeSingleString(
      `FULLRESYNC ${sysInfo.master_replid} ${sysInfo.master_repl_offset}`
    )
  }
}

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (query) => {
    try {
      const parsedQuery = parseRequest(query)
      const command = parsedQuery[0]
      const args = parsedQuery.slice(1)
      const resp = handlers[command.toLowerCase()](args)
      connection.write(resp)
    } catch (e) {
      console.error(e)
      connection.write(e.message + CRLF)
    }
  })
  connection.on('close', () => {
    console.log('Connection Closed: ')
    connection.end()
  })
})

const listeningPort = getPort(process.argv)
const replica = getReplica(process.argv)

if (replica) {
  performHandshake(replica.masterHost, replica.masterPort, listeningPort)
}

server.listen(listeningPort, '127.0.0.1')
