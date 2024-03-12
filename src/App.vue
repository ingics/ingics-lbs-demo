<template>
    <router-view />
</template>

<script>
import { defineComponent } from 'vue';
export default defineComponent({
    name: 'App',
    preFetch({ store }) {
        store.commit('gateway/init')
        store.commit('floorplan/init')
    }
})
</script>
