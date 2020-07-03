export function findById(state) {
    return id => {
        return state.list.find(v => v.id === id)
    }
}
