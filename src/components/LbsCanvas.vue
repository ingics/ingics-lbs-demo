<template>
    <div>
        <v-stage
            ref="stage"
            :config="configKonva"
            id="lbsStage"
            @dragstart="handleDragstart"
            @dragend="handleDragend"
        >
            <v-layer>
                <v-rect
                    :config="{
                        width: maxWidth,
                        height: maxHeight,
                        fill: '#F2F4F4'
                    }"
                />
                <v-image :config="{ image: backgroundImage }" />
            </v-layer>
            <v-layer v-for="item in drawingGws" :key="item.id">
                <v-group
                    :config="item"
                    @dblclick="launchGatewayConfig(item.id)"
                >
                    <v-circle v-if="beacon" :config="{
                            x: item.icon.x,
                            y: item.icon.y,
                            radius: calSingalRadius(item.id),
                            opacity: 0.5,
                            scale: { x: 1, y: 1 },
                            fillRadialGradientStartPoint: { x: 0, y: 0 },
                            fillRadialGradientEndPoint: { x: 0, y: 0 },
                            fillRadialGradientStartRadius: 10,
                            fillRadialGradientEndRadius: calSingalRadius(item.id),
                            fillRadialGradientColorStops: [
                                0, item.signal.fillStart, 1, item.signal.fillEnd]
                        }"
                    />
                    <v-circle :config="item.icon" />
                    <v-text :config="item.label" />
                </v-group>
                <v-star v-if="beacon" :config="{
                        x: cmToPixelX(beacon.x),
                        y: cmToPixelY(beacon.y),
                        numPoints: 5,
                        innerRadius: 10,
                        outerRadius: 20,
                        fill: 'red',
                        opacity: 0.8,
                        draggable: false
                    }"
                />
            </v-layer>
        </v-stage>
    </div>
</template>

<script>
export default {
    name: 'LbsCanvas',
    props: {
        maxWidth: {
            type: Number,
            default: 200
        },
        maxHeight: {
            type: Number,
            default: 200
        },
        imageSrc: {
            type: [String, null],
            default: null
        },
        gateways: {
            type: Array,
            default() {
                return []
            }
        },
        realWidth: {
            type: Number,
            default: 1000
        },
        realHeight: {
            type: Number,
            default: 1000
        },
        beacon: {
            type: [Object, null],
            default: null
        }
    },
    data() {
        return {
            configKonva: {
                width: this.maxWidth,
                height: this.maxHeight
            },
            drawingGws: [],
            draggingId: undefined,
            backgroundImage: null,
            colors: ['#ff9900', '#009900', '#0099ff'],
            lightColors: [ '#ffd699', '#99ff99', '#99d6ff' ]
        }
    },
    created() {},
    mounted() {
        this.handleImageSrcChanged(this.imageSrc)
        this.handleGatewayChanged()
    },
    watch: {
        gateways: {
            handler() {
                this.handleGatewayChanged()
            },
            deep: true
        },
        beacon: {
            handler(v) {
                this.handleGatewayChanged()
            },
            deep: true
        },
        maxWidth(v) {
            if (this.backgroundImage) {
                this.adjustImageSize(this.backgroundImage)
                this.configKonva.width = this.backgroundImage.width
                this.configKonva.height = this.backgroundImage.height
                this.adjustGatewayDrawing()
            } else {
                this.configKonva.width = v
                this.adjustGatewayDrawing()
            }
        },
        maxHeight(v) {
            if (this.backgroundImage) {
                this.adjustImageSize(this.backgroundImage)
                this.configKonva.width = this.backgroundImage.width
                this.configKonva.height = this.backgroundImage.height
                this.adjustGatewayDrawing()
            } else {
                this.configKonva.height = v
                this.adjustGatewayDrawing()
            }
        },
        imageSrc(v) {
            this.handleImageSrcChanged()
        },
        realWidth(v) {
            this.adjustGatewayDrawing()
        },
        realHeight(v) {
            this.adjustGatewayDrawing()
        }
    },
    methods: {
        dragBoundFunc(pos, e) {
            const maxx = this.configKonva.width - 1
            const maxy = this.configKonva.height - 1
            let x = pos.x < 0 ? 0 : pos.x > maxx ? maxx : pos.x
            let y = pos.y < 0 ? 0 : pos.y > maxy ? maxy : pos.y
            const gw = this.drawingGws.find(v => v.id === this.draggingId)
            if (gw) {
                gw.label.x = this.gwLabelX(x)
                gw.label.y = this.gwLabelY(y)
            }
            return { x, y }
        },
        adjustImageSize(image) {
            const scaleW = image.naturalWidth / this.maxWidth
            const scaleH = image.naturalHeight / this.maxHeight
            var scale = 1
            if (scaleW > scaleH && scaleW > 1) {
                scale = scaleW
            } else if (scaleH > scaleW && scaleH > 1) {
                scale = scaleH
            }
            image.width = image.naturalWidth / scale
            image.height = image.naturalHeight / scale
            return image
        },
        handleDragstart(e) {
            this.draggingId = e.target.attrs.id
        },
        handleDragend(e) {
            // store dragend position of gateway
            const gw = this.drawingGws.find(v => v.id === this.draggingId)
            if (gw) {
                gw.x = e.target.attrs.x
                gw.y = e.target.attrs.y
                gw.pos.x = this.pixelToCmX(gw.x)
                gw.pos.y = this.pixelToCmY(gw.y)
                this.$emit('gw-move', { id: gw.id, ...gw.pos })
            }
        },
        pixelToCmX(v) {
            return Math.round(v * (this.realWidth / this.configKonva.width))
        },
        pixelToCmY(v) {
            return Math.round(v * (this.realHeight / this.configKonva.height))
        },
        cmToPixelX(v) {
            return Math.round(v * (this.configKonva.width / this.realWidth))
        },
        cmToPixelY(v) {
            return Math.round(v * (this.configKonva.height / this.realHeight))
        },
        launchGatewayConfig(id) {
            this.$emit('gw-config', id)
        },
        handleImageSrcChanged() {
            const image = new window.Image()
            image.src = this.imageSrc
            image.onload = () => {
                this.backgroundImage = this.adjustImageSize(image)
                this.configKonva.width = this.backgroundImage.width
                this.configKonva.height = this.backgroundImage.height
                this.adjustGatewayDrawing()
            }
        },
        handleGatewayChanged() {
            this.gateways.forEach(cfg => {
                const gw = this.drawingGws.find(v => v.id === cfg.id)
                const drawingPosX = this.cmToPixelX(cfg.pos.x)
                const drawingPosY = this.cmToPixelY(cfg.pos.y)
                if (gw) {
                    gw.name = cfg.name
                    gw.label.text = this.gwLabel(cfg)
                    gw.pos = { ...cfg.pos }
                    gw.x = drawingPosX
                    gw.y = drawingPosY
                } else {
                    this.drawingGws.push({
                        id: cfg.id,
                        name: cfg.name,
                        pos: cfg.pos,
                        x: drawingPosX,
                        y: drawingPosY,
                        draggable: true,
                        dragBoundFunc: this.dragBoundFunc,
                        icon: {
                            x: 0,
                            y: 0,
                            radius: 10,
                            fill: this.colors[this.drawingGws.length],
                            stroke: 'black',
                            strokeWidth: 1
                        },
                        label: {
                            text: this.gwLabel(cfg),
                            x: this.gwLabelX(drawingPosX),
                            y: this.gwLabelY(drawingPosY)
                        },
                        signal: {
                            fillStart: this.colors[this.drawingGws.length],
                            fillEnd: this.lightColors[this.drawingGws.length]
                        }
                    })
                }
            })
        },
        adjustGatewayDrawing() {
            this.drawingGws.forEach(v => {
                v.x = this.cmToPixelX(v.pos.x)
                v.y = this.cmToPixelY(v.pos.y)
                v.label.x = this.gwLabelX(v.x)
                v.label.y = this.gwLabelY(v.y)
            })
        },
        gwLabelX(x) {
            return x > this.configKonva.width / 2 ? -70 : 20
        },
        gwLabelY(y) {
            return y > this.configKonva.height / 2 ? -30 : 20
        },
        gwLabel(cfg) {
            let text = cfg.name
            if (this.beacon) {
                let rssi = this.beacon.rssi_entries.find(v => v.gwid === cfg.id)
                if (rssi) {
                    text += `\nRSSI: ${rssi.rssi.toFixed(2)}`
                }
            }
            return text
        },
        calSingalRadius(id) {
            if (this.beacon) {
                let rssi = this.beacon.rssi_entries.find(v => v.gwid === id)
                if (rssi) {
                    let d = Math.pow(10, (this.beacon.refrssi - rssi.rssi) / 20)
                    let r = this.cmToPixelX(d * 100)
                    return r
                }
            }
            return 0
        }
    },
    destroyed() {}
}
</script>
