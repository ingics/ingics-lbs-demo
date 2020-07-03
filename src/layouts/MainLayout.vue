<template>
    <q-layout view="lHh Lpr lFf">
        <q-header elevated>
            <q-toolbar>
                <q-toolbar-title>
                    Ingics LBS Demo
                </q-toolbar-title>

                <q-btn flat dense round icon="play_arrow" @click="connect" />
                <q-btn flat dense round icon="stop" @click="disconnect" />
            </q-toolbar>
        </q-header>

        <q-page-container>
            <router-view />
        </q-page-container>
    </q-layout>
</template>

<script>
import { mapState } from 'vuex'
export default {
    name: 'MainLayout',

    data() {
        return {}
    },

    methods: {
        connect() {
            this.gateways.forEach(v => {
                const id = v.id
                this.$store.dispatch('gateway/connect', { id })
            })
        },
        disconnect() {
            this.gateways.forEach(v => {
                const id = v.id
                this.$store.dispatch('gateway/disconnect', { id })
            })
        }
    },

    computed: {
        ...mapState({
            gateways: state => state.gateway.list
        })
    }
}
</script>
