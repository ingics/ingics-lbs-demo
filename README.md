# Ingics LBS Demo (ingics-lbs-demo)

LBS demonstration with iGSXX.

![screenshot](assets/screenshot_1.png)

### Requirement

* iBSXX Beacon for tracking
* iGS01S/iGS03 Beacon Gateway * 3
  - Support PlainText format
  - Support M2M Server or MQTT mode
* A PC for compile and running this application
  - Tested with Ubuntu 22, Node v20
  - Quasar/Electron/NodeJS project should be runnable on Windows environment, but not officially tested

### Install Quasar Cli
This application is implemented using Quasar (v2) framework.
You must install quasar cli first for running the project.
- https://quasar.dev/start/quasar-cli

### Install the dependencies
```bash
npm install
```

### Start the app in development mode
```bash
quasar dev -m electron
```

### Quick Start Up

1. Upload background image (floorplan image)
2. Setup the image scale (real width & height)
3. Add 3 gateways (you can drag & drop the gateway location after added) (*)
4. Click start button on right-top
5. Select tracking beacon, the estimate location will show on screen

### Code Reference

Most code relative to location is in [src/store/gateway/mutations.js](src/store/gateway/mutations.js).

#### Kalman Filter

The RSSI value is quite variant caused by environment noise. I use Kalman Filter to smooth the RSSI readings for estimate the distance between gateway and beacon in this project.

Normally you will need to consider your target system to adjust different parameter or use different filter algorithm.

### Caution ***

The location algorithm used in this project has not been extensively tested and adjusted to prove its correctness. The purpose of this project is try to provide a reference that how to estimate the beacon location by gateway RSSI reading.

