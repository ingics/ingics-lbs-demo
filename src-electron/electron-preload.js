/**
 * This file is used specifically for security reasons.
 * Here you can access Nodejs stuff and inject functionality into
 * the renderer thread (accessible there through the "window" object)
 *
 * WARNING!
 * If you import anything from node_modules, then make sure that the package is specified
 * in package.json > "dependencies" and NOT in "devDependencies"
 *
 * Example (injects window.myAPI.doAThing() into renderer thread):
 *
 *   const { contextBridge } = require('electron')
 *
 *   contextBridge.exposeInMainWorld('myAPI', {
 *     doAThing: () => {}
 *   })
 */

const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('backend', {
    connect: (id, host, port, topic) => ipcRenderer.send('connect', { id, host, port, topic }),
    disconnect: (id) => ipcRenderer.send('disconnect', id),
    onConnect: (callback) => ipcRenderer.on('connect', (event, id) => callback(id)),
    onMessage: (callback) => ipcRenderer.on('message', (event, id, message) => callback({ id, message })),
    onClose: (callback) => ipcRenderer.on('close', (event, id) => callback(id)),
    onError: (callback) => ipcRenderer.on('error', (event, id, error) => callback(id, error)),
})
