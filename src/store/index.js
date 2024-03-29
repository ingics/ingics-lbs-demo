import { createStore } from 'vuex'
import gateway from './gateway'
import floorplan from './floorplan'

// import example from './module-example'

export default function (/* { ssrContext } */) {
  const Store = createStore({
    modules: {
        gateway,
        floorplan
    },

    // enable strict mode (adds overhead!)
    // for dev mode and --debug builds only
    strict: process.env.DEBUGGING
  })

  return Store
}
