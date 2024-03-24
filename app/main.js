const net = require('net')
const { parseRequest } = require('./redisSerializableParser')
const { getPort, getReplica, parseEvents } = require('./utils')
const { CRLF } = require('./constants')
const commands = require('./commands')
const { performHandshake } = require('./replicaClient')

const server = net.createServer((connection) => {
  connection.setEncoding('utf8')
  connection.on('data', (event) => {
    try {
      const requests = parseEvents(event)
      for (const request of requests) {
        const parsedRequest = parseRequest(request)
        const command = parsedRequest[0]
        const args = parsedRequest.slice(1)
        const resp = commands[command.toLowerCase()](args, connection, request)
        if (resp) connection.write(resp)
      }
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
