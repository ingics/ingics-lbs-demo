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

window.backend.onConnect(id => {
    console.log('backend-onConnect', id)
    if (id in connections) {
        connections[id].connected = true
    }
})

window.backend.onMessage(({id, message}) => {
    // console.log('backend-onMessage', id, message)
    if (id in connections) {
        handleMessage(connections[id].commit, id, message)
    }
})

window.backend.onClose((id) => {
    console.log('backend-onClose', id)
    if (id in connections) {
        delete connections[id]
    }
})

window.backend.onError((id, error) => {
    console.log('backend-onError', id, error)
})

export function connect({ commit, state }, { id }) {
    // console.log('gateway/connect', id)
    let gw = state.list.find(v => v.id === id)
    if (gw) {
        window.backend.connect(gw.id, gw.host, gw.port, gw.topic)
        connections[id] = {
            commit,
            connected: false
        }
    }
}

export function disconnect({ commit, state }, { id }) {
    // console.log('gateway/disconnect', id, connections)
    if (id in connections) {
        if (connections[id].connected) {
            window.backend.disconnect(id)
        } else {
            delete connections[id]
        }
    }
}

export function traceBeacon({ commit, state }, { mac }) {
    // console.log('gateway/traceBeacon', mac)
    commit('trace', { mac })
}
