// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueHighcharts from 'vue-highcharts'
import loadStock from 'highcharts/modules/stock'
import loadExporting from 'highcharts/modules/exporting'
import Highcharts from 'highcharts'
import Tabs from 'vue-tabs-component'
import vClickOutside from 'v-click-outside'
import Toast from 'vue-easy-toast'
import VueAnalytics from 'vue-analytics'

require('../node_modules/bootstrap/scss/bootstrap.scss') // Bootstrap
require('../node_modules/font-awesome/css/font-awesome.min.css') //   Icons

loadStock(Highcharts)
loadExporting(Highcharts)
Vue.use(VueHighcharts, { Highcharts })

Vue.use(vClickOutside)
Vue.use(Tabs)
Vue.use(Toast)

Vue.config.productionTip = false

/* Constantes */
let metadataApiBaseUrl
if (process.env.NODE_ENV === 'production') {
    metadataApiBaseUrl = 'http://api-series-de-tiempo.tasacionya.com/'
} else {
    metadataApiBaseUrl = 'http://localhost:8000/'
}

export const globalStore = new Vue({
    data: {
        metadataApiBaseUrl: metadataApiBaseUrl,
        analyticsId: 'UA-11247975-11'
    }
})

Vue.use(VueAnalytics, {
    id: [globalStore.analyticsId]
})

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    template: '<App/>',
    components: { App }
})
