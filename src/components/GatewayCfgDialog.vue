<template>
    <q-dialog v-model="dialogValue">
        <q-card :style="{ minWidth: '50vw' }">
            <q-card-section>
                <div>
                    <q-select
                        outlined
                        label="Protocol"
                        v-model="newApp"
                        :options="apps"
                        emit-value
                        map-options
                    />
                    <q-input
                        outlined
                        label="Name"
                        v-model="newName"
                        class="q-mb-xs"
                    />
                    <q-input
                        outlined
                        label="Host"
                        v-model="newHost"
                        class="q-mb-xs"
                    />
                    <q-input
                        outlined
                        label="Port"
                        type="number"
                        v-model.number="newPort"
                        hide-bottom-space
                        class="q-mb-xs"
                    />
                    <q-input
                        v-if="newApp == 'mqtt'"
                        outlined
                        label="Subscribe Topic"
                        v-model="newTopic"
                        class="q-mb-xs"
                    />
                    <q-input
                        outlined
                        label="Position X"
                        type="number"
                        v-model.number="newPosX"
                        suffix="cm"
                        hide-bottom-space
                        class="q-mb-xs"
                    />
                    <q-input
                        outlined
                        label="Position Y"
                        type="number"
                        v-model.number="newPosY"
                        suffix="cm"
                        hide-bottom-space
                        class="q-mb-xs"
                    />
                </div>
            </q-card-section>
            <q-card-actions align="right">
                <q-btn flat dense v-close-popup color="primary">Cancel</q-btn>
                <q-btn
                    flat
                    dense
                    v-close-popup
                    @click="saveSetting"
                    color="primary"
                    >Save</q-btn
                >
            </q-card-actions>
        </q-card>
    </q-dialog>
</template>

<script>
export default {
    // name: 'ComponentName',
    props: {
        value: {
            type: Boolean,
            default: false
        },
        cfg: {
            type: [Object, null],
            default: () => {
                return null
            }
        }
    },
    data() {
        return {
            newApp: 'mqtt',
            newName: '',
            newHost: '192.168.1.20',
            newPort: 2883,
            newTopic: 'testroom/x',
            newPosX: 100,
            newPosY: 100,
            dialogValue: false,
            apps: [
                {
                    label: 'MQTT',
                    value: 'mqtt'
                },
                {
                    label: 'M2M',
                    value: 'm2m'
                }
            ]
        }
    },
    mounted() {
        this.dialogValue = this.value
        if (this.cfg) {
            this.newApp = this.cfg.app
            this.newName = this.cfg.name
            this.newHost = this.cfg.host
            this.newPort = this.cfg.port
            this.newTopic = this.cfg.topic
            this.newPosX = this.cfg.pos.x
            this.newPosY = this.cfg.pos.y
        }
    },
    watch: {
        value(v) {
            this.dialogValue = v
        },
        dialogValue(v) {
            this.$emit('input', v)
        }
    },
    methods: {
        saveSetting() {
            this.$emit('save', {
                app: this.newApp,
                name: this.newName.trim(),
                host: this.newHost.trim(),
                port: this.newPort,
                topic: this.newTopic.trim(),
                pos: {
                    x: this.newPosX,
                    y: this.newPosY
                }
            })
        }
    }
}
</script>
