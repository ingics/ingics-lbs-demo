<template>
    <div id="q-app">
        <router-view />
    </div>
</template>

<script>
export default {
    name: 'App',
    preFetch({ store }) {
        store.commit('gateway/init')
        store.commit('floorplan/init')
    }
}
</script>
