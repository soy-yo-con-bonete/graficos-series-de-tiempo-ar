<template>
    <div id="app">
        <div v-if="loadingFromAPI" class="d-flex flex-column align-items-center justify-content-center h4" id="hide-screen">
            <div class="spinner-container">
                <Spinner size="massive" message="Cargando..."/>
            </div>
        </div>
        <router-view/>
    </div>
</template>

<script>
    import Spinner from 'vue-simple-spinner'
    import bus from './event-bus.js'

    export default {
        name: 'app',
        components: {
            Spinner
        },
        data () {
            return {
                loadingFromAPI: false
            }
        },
        mounted: function () {
            let self = this
            bus.$on('before-loading-data-from-api', function () {
                self.loadingFromAPI = true
            })
            bus.$on('finished-loading-data-from-api', function () {
                self.loadingFromAPI = false
            })

            // Also, when loading the page, load the IPC series to adjust series instantly
            bus.getPriceDeflactorSeries()
            // When we load the page, get all meta data from the query string and load the corresponding graphs
            if (self.$route.query.meta !== undefined) {
                bus.$on('price-deflactor-finished-loading', function () {
                    bus.setAllMetaData(JSON.parse(self.$route.query.meta))
                })
            }
        }
    }
</script>

<style>
    #app {
        font-family: 'Avenir', Helvetica, Arial, sans-serif;
        -webkit-font-smoothing: antialiased;
        -moz-osx-font-smoothing: grayscale;
        /*text-align: center;*/
        color: #2c3e50;
        margin-top: 10px;
    }
    html {
        font-size: 14px;
    }
    #hide-screen {
        height: 100vh;
        width: 100vw;
        z-index: 1000;
        position: fixed;
        left: 0;
        top: 0;
        background: rgba(0, 0, 0, 0.15);
    }
    #hide-screen .spinner-container {
        background: rgba(255, 255, 255, 1);
        padding: 1rem;
        border-radius: 5px;
    }



    /* vue-tabs-component styling */
    .tabs-component {
        margin: 0.5rem 0;
    }

    .tabs-component-tabs {
        border: solid 1px #ddd;
        border-radius: 6px;
        margin-bottom: 5px;
    }

    @media (min-width: 700px) {
        .tabs-component-tabs {
            border: 0;
            align-items: stretch;
            display: flex;
            justify-content: flex-start;
            margin-bottom: -1px;
        }
    }

    .tabs-component-tab {
        color: #999;
        font-size: 14px;
        font-weight: 600;
        margin-right: 0;
        list-style: none;
    }

    .tabs-component-tab:not(:last-child) {
        border-bottom: dotted 1px #ddd;
    }

    .tabs-component-tab:hover {
        color: #666;
    }

    .tabs-component-tab.is-active {
        color: #000;
    }

    .tabs-component-tab.is-disabled * {
        color: #cdcdcd;
        cursor: not-allowed !important;
    }

    @media (min-width: 700px) {
        .tabs-component-tab {
            background-color: #fff;
            border: solid 1px #ddd;
            border-radius: 3px 3px 0 0;
            margin-right: .5em;
            transform: translateY(-1px);
            transition: transform .3s ease;
        }

        .tabs-component-tab.is-active {
            border-bottom: solid 1px #fff;
            z-index: 2;
            transform: translateY(0);
        }
    }

    .tabs-component-tab-a {
        align-items: center;
        color: inherit;
        display: flex;
        padding: .75em 1em;
        text-decoration: none;
    }

    .tabs-component-panels {
        padding: 1rem 0;
    }

    @media (min-width: 700px) {
        .tabs-component-panels {
            border-top-left-radius: 0;
            background-color: #fff;
            border: solid 1px #ddd;
            border-radius: 0 6px 6px 6px;
            box-shadow: 0 0 10px rgba(0, 0, 0, .05);
            padding: 1rem 0.5rem;
        }
    }


</style>
