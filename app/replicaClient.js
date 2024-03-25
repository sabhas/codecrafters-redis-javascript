const net = require('net')
const { encodeArray, parseRequest } = require('./redisSerializableParser')
const { parseEvents } = require('./utils')
const commands = require('./commands')

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

  client.on('data', (data) => {
    try {
      const requests = parseEvents(data.toString())
      for (const request of requests) {
        if (request.startsWith('*')) {
          const parsedRequest = parseRequest(request)
          const command = parsedRequest[0]
          const args = parsedRequest.slice(1)

          if (command.toLowerCase() === 'replconf' && args[0] === 'GETACK') {
            client.write(encodeArray(['REPLCONF', 'ACK', '0']))
            continue
          }

          commands[command.toLowerCase()](args, client, request, true)
        }
      }
    } catch (e) {
      console.error(e)
      throw e
    }
  })
}

module.exports = {
  performHandshake
}
