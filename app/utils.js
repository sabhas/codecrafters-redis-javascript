const { FLAG } = require('./constants')

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

module.exports = { getPort, getReplica, getSysInfo }
