import { createRouter, createMemoryHistory, createWebHistory, createWebHashHistory } from 'vue-router'
import routes from './routes'

export default function (/* { store, ssrContext } */) {
  const createHistory = process.env.SERVER
    ? createMemoryHistory
    : process.env.VUE_ROUTER_MODE === 'history' ? createWebHistory : createWebHashHistory

  const Router = createRouter({
    scrollBehavior: () => ({ left: 0, top: 0 }),
    routes,

    // Leave this as is and make changes in the quasar.config file instead!
    // quasar.config file -> build -> vueRouterMode
    // quasar.config file -> build -> publicPath
    history: createHistory(process.env.VUE_ROUTER_BASE)
  })

  return Router
}