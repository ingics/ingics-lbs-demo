<template>
    <q-page class="flex full-height column q-pa-md" id="mypage">
        <q-item align-content-start class="q-px-none" id="configuration">
            <q-input
                v-model.number="realWidth"
                outlined
                label="Width"
                suffix="cm"
                class="q-mr-md"
            />
            <q-input
                v-model.number="realHeight"
                outlined
                label="Height"
                suffix="cm"
                class="q-mr-md"
            />
            <q-file
                v-model="bgImgFile"
                outlined
                label="Upload Background Image"
                @update:model-value="handleBgImg"
            >
                <template v-slot:prepend>
                    <q-icon name="attach_file" />
                </template>
            </q-file>
        </q-item>

        <lbs-canvas
            ref="canvas"
            :maxWidth="maxCanvasW"
            :maxHeight="maxCanvasH"
            :imageSrc="bgImgSrc"
            :gateways="gateways"
            :beacon="tracedBeacon"
            :realWidth="realWidth"
            :realHeight="realHeight"
            @gw-move="gatewayMoved"
            @gw-config="launchGatewayCfg"
        />

        <q-page-sticky position="bottom-right" :offset="[18, 18]">
            <q-fab
                v-model="expandFabActions"
                vertical-actions-align="right"
                color="primary"
                glossy
                icon="keyboard_arrow_up"
                direction="up"
            >
                <q-fab-action
                    color="secondary"
                    icon="add"
                    label="Add Gateway"
                    @click="launchGatewayCfg()"
                />
                <q-fab-action
                    color="orange"
                    icon="airplay"
                    label="Select Beacon"
                    @click="selectBeaconDialog = !selectBeaconDialog"
                />
            </q-fab>
        </q-page-sticky>

        <gateway-cfg-dialog
            :cfg="currentCfg"
            :key="currentCfgKey"
            @save="saveGatewaySetting"
            v-model="currentCfgDialog"
        />

        <q-dialog v-model="selectBeaconDialog">
            <q-card :style="{ minWidth: '50vw' }">
                <q-list dense bordered padding class="rounded-borders">
                    <q-item
                        v-for="item in beacons"
                        :key="item.mac"
                        clickable
                        v-ripple
                        @click="startTraceBeacon(item)"
                    >
                        <q-item-section>{{ item.mac }}</q-item-section>
                        <q-item-section>{{ item.name }}</q-item-section>
                    </q-item>
                </q-list>
            </q-card>
        </q-dialog>
    </q-page>
</template>

<script>
import _ from 'lodash'
import { mapState, mapMutations } from 'vuex'
import LbsCanvas from '../components/LbsCanvas'
import GatewayCfgDialog from '../components/GatewayCfgDialog'
export default {
    name: 'PageIndex',
    components: {
        LbsCanvas,
        GatewayCfgDialog
    },
    data() {
        return {
            currentCfg: undefined,
            currentCfgKey: '',
            currentCfgDialog: false,
            maxCanvasW: 200,
            maxCanvasH: 200,
            bgImgFile: undefined,
            handleWindowResizing: _.debounce(this.adjustCanvasSize, 200),
            expandFabActions: false,
            selectedBeacon: null,
            selectBeaconDialog: false
        }
    },
    created() {
        window.addEventListener('resize', this.handleWindowResizing)
    },
    mounted() {
        this.adjustCanvasSize()
    },
    methods: {
        adjustCanvasSize() {
            const page = document.querySelector('#mypage')
            const cfg = document
                .querySelector('#configuration')
                .getBoundingClientRect()
            this.maxCanvasW = page.offsetWidth - 32
            this.maxCanvasH =
                window.innerHeight -
                page.getBoundingClientRect().y -
                32 -
                cfg.height
        },
        handleBgImg(e) {
            let reader = new FileReader()
            reader.onload = (r, ev) => { this.bgImgSrc = reader.result }
            reader.readAsDataURL(this.bgImgFile)
        },
        addGateway(e) {
            this.$refs.canvas.addGateway()
        },
        launchGatewayCfg(id) {
            this.currentCfg = this.$store.getters['gateway/findById'](id)
            this.currentCfgKey = Math.round(Math.random() * 10000)
            this.currentCfgDialog = true
        },
        saveGatewaySetting(cfg) {
            console.log("saveGatewaySetting", cfg)
            if (this.currentCfg) {
                console.log(this.currentCfg.id)
                this.setGateway({ ...cfg, id: this.currentCfg.id })
            } else {
                const id = `gw${this.gateways.length + 1}`
                this.setGateway({ ...cfg, id })
            }
        },
        gatewayMoved(data) {
            this.moveGateway(data)
        },
        ...mapMutations({
            setGateway: 'gateway/configurate',
            moveGateway: 'gateway/move'
        }),
        startTraceBeacon (item) {
            this.selectedBeacon = item
            this.selectBeaconDialog = false
            this.$store.dispatch('gateway/traceBeacon', { mac: item.mac })
        }
    },
    computed: {
        ...mapState({
            gateways: state => state.gateway.list,
            beacons: state => state.gateway.beacons,
            tracedBeacon: state => state.gateway.tracedBeacon
        }),
        realWidth: {
            get() {
                return this.$store.state.floorplan.width
            },
            set(width) {
                this.$store.commit('floorplan/setWidth', { width })
            }
        },
        realHeight: {
            get() {
                return this.$store.state.floorplan.height
            },
            set(height) {
                this.$store.commit('floorplan/setHeight', { height })
            }
        },
        bgImgSrc: {
            get() {
                return this.$store.state.floorplan.dataUrl
            },
            set(dataUrl) {
                this.$store.commit('floorplan/setDataUrl', { dataUrl })
            }
        }
    },
    unmounted() {
        window.removeEventListener('resize', this.handleWindowResizing)
    }
}
</script>
