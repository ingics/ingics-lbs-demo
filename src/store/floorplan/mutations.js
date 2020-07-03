import { LocalStorage } from 'quasar'
import { store } from 'quasar/wrappers'

export function init(state) {
    let data = LocalStorage.getItem('floorplan')
    if (data) {
        state.width = data.width
        state.height = data.height
        state.dataUrl = data.dataUrl
    }
}

function save(state) {
    LocalStorage.set('floorplan', {
        width: state.width,
        height: state.height,
        dataUrl: state.dataUrl
    })
}

export function setWidth(state, { width }) {
    state.width = width
    save(state)
}

export function setHeight(state, { height }) {
    state.height = height
    save(state)
}

export function setDataUrl(state, { dataUrl }) {
    state.dataUrl = dataUrl
    save(state)
}
