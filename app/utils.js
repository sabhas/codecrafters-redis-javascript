const net = require('net')
const { FLAG } = require('./constants')
const { encodeBulkString, encodeArray } = require('./redisSerializableParser')

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

module.exports = {
  getPort,
  getReplica,
  getRole,
  getSysInfo,
  getRedisInfo,
  performHandshake
}
