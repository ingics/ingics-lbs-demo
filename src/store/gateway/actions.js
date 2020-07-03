import net from 'net'
import mqtt from 'mqtt'
import readline from 'readline'
import { parseMessage } from '@ingics/message-parser'

const connections = {}

function handleMessage(commit, gwid, payload) {
    parseMessage(payload, data => {
        if (!['GPRP', 'LRAD', '1MAD'].includes(data.type)) {
            return
        }
        let ad = data.advertisement
        let msd = ad.manufacturerData
        if (!msd || !msd.is('ibs')) {
            return
        }
        let name = msd.type
        let { beacon, rssi, timestamp } = data
        commit('updateBeacon', { gwid, mac: beacon, name, rssi, timestamp })
    })
}

function mqttConnect(commit, gw) {
    let { id, host, port, topic } = gw
    // console.log('gateway/mqttConnect', id, host, port, topic)
    if (id in connections) {
        // client already exists
        return
    } else {
        let client = mqtt.connect({ host, port })
        client.on('connect', function() {
            // console.log('gateway/mqttConnect', id, 'connected')
            connections[id] = client
            client.subscribe(topic)
        })
        client.on('message', function(topic, payload) {
            handleMessage(commit, id, payload.toString())
        })
        client.on('close', function() {
            // console.log('gateway/mqttConnect', id, 'closed')
            if (id in connections) {
                delete connections[id]
            }
        })
        client.on('error', function(e) {
            // console.log('gateway/mqttConnect', id, 'error', e)
        })
    }
}

function m2mConnect(commit, gw) {
    let { id, host, port } = gw
    // console.log('gateway/m2mConnect', id, host, port)
    if (id in connections) {
        // client already exists
        return
    } else {
        let client = new net.Socket()
        client.on('connect', function() {
            // console.log('gateway/m2mConnect', id, 'connected')
            connections[id] = client
            let rl = readline.createInterface({ input: client })
            rl.on('line', line => {
                handleMessage(commit, id, line.trim())
            })
        })
        client.on('close', function() {
            // console.log('gateway/m2mConnect', id, 'closed')
            if (id in connections) {
                delete connections[id]
            }
        })
        client.on('timeout', function() {
            // console.log('gateway/m2mConnect', id, 'timeout')
        })
        client.on('error', function(e) {
            // console.log('gateway/m2mConnect', id, 'error', e)
        })
        client.connect(port, host)
    }
}

export function connect({ commit, state }, { id }) {
    // console.log('gateway/connect', id)
    let gw = state.list.find(v => v.id === id)
    if (gw) {
        if (gw.app === 'mqtt') {
            mqttConnect(commit, gw)
        } else if (gw.app === 'm2m') {
            m2mConnect(commit, gw)
        }
    }
}

export function disconnect({ commit, state }, { id }) {
    // console.log('gateway/disconnect', id)
    if (id in connections) {
        connections[id].end()
    }
}

export function traceBeacon({ commit, state }, { mac }) {
    // console.log('gateway/traceBeacon', mac)
    commit('trace', { mac })
}
