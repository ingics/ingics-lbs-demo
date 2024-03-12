import Vue from 'vue'
import axios from 'axios'

export default ({ app }) => {
    app.config.globalProperties.$axios = axios
}
