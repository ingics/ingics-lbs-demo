import { app, BrowserWindow, nativeTheme, ipcMain } from 'electron'
import net from 'net'
import path from 'path'
import mqtt from 'mqtt'
import { connect } from 'http2'

try {
  if (process.platform === 'win32' && nativeTheme.shouldUseDarkColors === true) {
    require('fs').unlinkSync(require('path').join(app.getPath('userData'), 'DevTools Extensions'))
  }
} catch (_) { }

/**
 * Set `__statics` path to static files in production;
 * The reason we are setting it here is that the path needs to be evaluated at runtime
 */
if (process.env.PROD) {
  global.__statics = __dirname
}

let mainWindow

function createWindow () {
  /**
   * Initial window options
   */
  mainWindow = new BrowserWindow({
    width: 1000,
    height: 600,
    useContentSize: true,
    webPreferences: {
      // we enable contextIsolation (Electron 12+ has it enabled by default anyway)
      contextIsolation: true,
      // we use a new way to reference the preload script
      // (it's going to be needed, so add it and create the file if it's not there already)
      preload: path.resolve(__dirname, process.env.QUASAR_ELECTRON_PRELOAD)
    }
  })

  // mainWindow.removeMenu()
  mainWindow.loadURL(process.env.APP_URL)

  if (process.env.DEBUGGING) {
    // if on DEV or Production with debug enabled
    mainWindow.webContents.openDevTools()
  }
  else {
    // we're on production; no access to devtools pls
    mainWindow.webContents.on('devtools-opened', () => {
      mainWindow.webContents.closeDevTools()
    })
  }

  mainWindow.on('closed', () => {
    mainWindow = null
  })
}

// try to disable htto cache
app.commandLine.appendSwitch('disable-http-cache')

const connections = {}

function mqttConnect(id, url, topic) {
  const client = mqtt.connect(url)
  client.on('connect', () => {
    console.log('mqtt-connect', id, 'connected')
    mainWindow.webContents.send('connect', id)
    client.subscribe(topic)
    connections[id] = client
  })
  client.on('message', (topic, payload) => {
    // console.log('mqtt-message', id, payload.toString())
    mainWindow.webContents.send('message', id, payload.toString())
  })
  client.on('close', () => {
    console.log('mqtt-close', id)
    if (id in connections) {
      delete connections[id]
    }
    mainWindow.webContents.send('close', id)
  })
  client.on('error', (e) => {
    console.log('mqtt-error', id, e)
    mainWindow.webContents.send('error', id, e)
  })
}

function m2mConnect(id, host, port) {
  const socket = new net.Socket()
  socket.on('connect', () => {
    console.log('m2m-connect', id, 'connected')
    mainWindow.webContents.send('connect', id)
    const rl = readline.createInterface({ input: socket })
    rl.on('line', line => {
      console.log('m2m-message', id, line.trim())
      mainWindow.webContents.send('message', id, line.trim())
    })
    connections[id] = socket
  })
  socket.on('close', () => {
    console.log('m2m-close', id)
    if (id in connections) {
      delete connections[id]
    }
    mainWindow.webContents.send('close', id)
  })
  socket.on('timeout', () => {
    console.log('m2m-timeout', id)
    mainWindow.webContents.send('error', id, 'timeout')
  })
  socket.on('error', (e) => {
    console.log('m2m-error', id, e)
    mainWindow.webContents.send('error', id, e)
  })
  socket.connect(port, host)
}

app.on('ready', () => {

  ipcMain.on('connect', (event, { id, host, port, topic }) => {
    console.log('backend-connect', { id, host, port, topic })
    if (topic) {
      mqttConnect(id, `mqtt://${host}:${port}`, topic)
    } else {
      m2mConnect(id, host, port)
    }
  })

  ipcMain.on('disconnect', (event, id) => {
    console.log('backend-disconnect', id)
    if (id in connections) {
      connections[id].end()
    }
  })

  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})
