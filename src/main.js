// The Vue build version to load with the `import` command
// (runtime-only or standalone) has been set in webpack.base.conf with an alias.
import Vue from 'vue'
import App from './App'
import router from './router'
import VueHighcharts from 'vue-highcharts'
import loadStock from 'highcharts/modules/stock'
import Highcharts from 'highcharts'
import Tabs from 'vue-tabs-component'
import vClickOutside from 'v-click-outside'
import Toast from 'vue-easy-toast'

require('../node_modules/bootstrap/scss/bootstrap.scss') // Bootstrap
require('../node_modules/font-awesome/css/font-awesome.min.css') //   Icons

loadStock(Highcharts)
Vue.use(VueHighcharts, { Highcharts })

Vue.use(vClickOutside)
Vue.use(Tabs)
Vue.use(Toast)

Vue.config.productionTip = false

export const globalStore = new Vue({
    data: {
        metadataApiBaseUrl: 'http://api-series-de-tiempo.tasacionya.com/'
    }
})

/* eslint-disable no-new */
new Vue({
    el: '#app',
    router,
    template: '<App/>',
    components: { App }
})
