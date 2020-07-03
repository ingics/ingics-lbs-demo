import moment from 'moment'
import kalman from 'kalmanjs'
import { Matrix, pseudoInverse } from 'ml-matrix'
import { LocalStorage } from 'quasar'

export function init(state) {
    // console.log('gateway/init')
    let gateways = LocalStorage.getItem('gateways')
    if (gateways) {
        state.list = gateways
    }
}

export function save(state) {
    // console.log('gateway/save')
    LocalStorage.set('gateways', state.list)
}

export function configurate(state, payload) {
    // console.log('gateway/configurate', payload)
    let gw = state.list.find(v => v.id === payload.id)
    if (gw) {
        gw.name = payload.name
        gw.app = payload.app
        gw.host = payload.host
        gw.port = payload.port
        gw.topic = payload.topic
        gw.pos.x = payload.pos.x
        gw.pos.y = payload.pos.y
    } else {
        state.list.push({ ...payload })
    }
    LocalStorage.set('gateways', state.list)
}

export function move(state, { id, x, y }) {
    // console.log('gateway/move', id, x, y)
    let gw = state.list.find(v => v.id === id)
    if (gw) {
        gw.pos.x = x
        gw.pos.y = y
        LocalStorage.set('gateways', state.list)
    }
}

function location_cal_with_refrssi(x, y, xx, yy, rssi, refrssi) {
    let d = Array.from(rssi, v => Math.pow(10, (refrssi - v) / 20))
    let dd = Array.from(d, v => Math.pow(v, 2))
    let A = new Matrix([
        [2 * (x[1] - x[0]), 2 * (y[1] - y[0])],
        [2 * (x[2] - x[1]), 2 * (y[2] - y[1])],
        [2 * (x[0] - x[2]), 2 * (y[0] - y[2])]
    ])
    let b = new Matrix([
        [dd[0] - dd[1] - xx[0] + xx[1] - yy[0] + yy[1]],
        [dd[1] - dd[2] - xx[1] + xx[2] - yy[1] + yy[2]],
        [dd[2] - dd[0] - xx[2] + xx[0] - yy[2] + yy[0]]
    ])
    let ans = pseudoInverse(A)
        .mmul(b)
        .mul(100)
    let cal_x = ans.get(0, 0)
    let cal_y = ans.get(1, 0)
    let total_d_diff = 0
    for (let i = 0; i < 3; i++) {
        const d_by_cal = Math.sqrt(
            Math.pow(cal_x / 100 - x[i], 2) + Math.pow(cal_y / 100 - y[i], 2)
        )
        total_d_diff += Math.abs(d[0] - d_by_cal)
    }
    // console.log(
    //     'location_cal_with_refrssi',
    //     cal_x,
    //     cal_y,
    //     total_d_diff,
    //     refrssi
    // )
    return { x: cal_x, y: cal_y, diff: total_d_diff }
}

function location(state, beacon) {
    if (beacon.rssi_entries.length < 3) {
        return
    }
    let gws = Array.from(beacon.rssi_entries, v =>
        state.list.find(x => x.id === v.gwid)
    )
    let x = Array.from(gws, v => v.pos.x / 100.0) // in meter
    let y = Array.from(gws, v => v.pos.y / 100.0) // in meter
    let xx = Array.from(x, v => Math.pow(v, 2))
    let yy = Array.from(y, v => Math.pow(v, 2))
    let rssi = Array.from(beacon.rssi_entries, v => v.rssi)

    let ans_refrssi = beacon.refrssi
    let ans_x = beacon.x
    let ans_y = beacon.y
    let min_diff = Number.MAX_VALUE
    for (let refrssi = -65; refrssi <= -45; refrssi++) {
        let ans = location_cal_with_refrssi(x, y, xx, yy, rssi, refrssi)
        if (ans.diff < min_diff) {
            min_diff = ans.diff
            ans_x = ans.x
            ans_y = ans.y
            ans_refrssi = refrssi
        } else {
            break
        }
    }
    beacon.x = ans_x
    beacon.y = ans_y
    beacon.refrssi = ans_refrssi
}

export function updateBeacon(state, { gwid, mac, name, rssi, timestamp }) {
    const ts = moment(timestamp).format('L LTS')
    // console.log('gateway/updateBeacon', gwid, mac, rssi, ts)
    let beacon = state.beacons.find(v => v.mac === mac)
    if (beacon) {
        let entry = beacon.rssi_entries.find(v => v.gwid === gwid)
        if (entry) {
            entry.rssi = entry.kf.filter(rssi)
            entry.timestamp = timestamp
        } else {
            let kf = new kalman({ R: 0.01, Q: 16 })
            beacon.rssi_entries.push({
                gwid,
                kf,
                rssi: kf.filter(rssi),
                timestamp
            })
        }
        if (beacon.trace) {
            location(state, beacon)
            // console.log(
            //     'gateway/updateBeacon',
            //     'location',
            //     beacon.x,
            //     beacon.y,
            //     beacon.refrssi
            // )
        }
    } else {
        let kf = new kalman({ R: 0.01, Q: 16 })
        state.beacons.push({
            mac,
            name,
            x: undefined,
            y: undefined,
            refrssi: -55,
            trace: false,
            rssi_entries: [{ gwid, kf, rssi: kf.filter(rssi), timestamp }]
        })
    }
}

export function trace(state, { mac }) {
    // console.log('gateway/trace', mac)
    let tracedBeacon = state.beacons.find(v => v.trace === true)
    if (tracedBeacon) {
        tracedBeacon.trace = false
        tracedBeacon.x = undefined
        tracedBeacon.y = undefined
    }
    let targetBeacon = state.beacons.find(v => v.mac === mac)
    if (targetBeacon) {
        targetBeacon.trace = true
        state.tracedBeacon = targetBeacon
    }
}
