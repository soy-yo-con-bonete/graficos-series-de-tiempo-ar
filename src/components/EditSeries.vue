<template>
    <div>
        <div class="list-group">
            <a v-for="series in seriesArray" href="#" class="list-group-item list-group-item-action flex-column align-items-start">
                <div class="d-flex w-100 justify-content-between">
                    <div class="h6 mb-1" @click.prevent="editSeries(series)">{{ series.serie_descripcion}}</div>
                    <div class="ml-2" style="flex-shrink: 0;">
                        <span @click.prevent="editSeries(series)"><i class="fa fa-pencil fa-lg"></i></span>&nbsp;&nbsp;
                        <span @click.prevent="removeSeries(series.internal_series_id)"><i class="fa fa-trash fa-lg"></i></span>
                    </div>

                </div>
                <div class="mt-2" v-if="series.internal_series_id === currentEditedSeriesId">
                    <form>
                        <div class="form-group row">
                            <label class="col-form-label col-3" for="inputYAxis">Eje Y</label>
                            <div class="col-9">
                                <select v-model="seriesYAxis" @change="updateYAxis" id="inputYAxis" class="form-control">
                                    <option disabled value="">Elegir uno...</option>
                                    <option value="0">Izquierdo</option>
                                    <option value="1">Derecho</option>
                                </select>
                            </div>

                        </div>
                        <div class="form-group row">
                            <label class="col-form-label col-3" for="select-representation-mode">Unidades</label>
                            <div class="col-5">
                                <select v-model="representation_mode.type" @change="updateRepresentationMode($event)" id="select-representation-mode" class="form-control">
                                    <option disabled value="">Elegir uno...</option>
                                    <option value="value">Valor</option>
                                    <option value="value_with_deflactor">Valor adjustado por Inflación Verdadera</option>
                                    <option value="change">Cambio</option>
                                    <option value="percent_change">% de Cambio vs. período anterior</option>
                                    <option value="percent_change_a_year_ago">% de Cambio vs. año anterior</option>
                                    <option value="index_100">Índice base 100</option>
                                </select>
                            </div>
                            <div class="col-4" v-if="representation_mode.type === 'index_100'">
                                <div>
                                    <select v-model="representation_mode.index100Date" @change="updateRepresentationMode($event)" class="form-control">
                                        <option disabled value="">Elegir uno...</option>
                                        <option v-for="date in availableDates" :value="date">{{date}}</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div class="form-group row">
                            <label class="col-form-label col-3" for="select-data-transform">Transformar</label>
                            <div class="col-5">
                                <select v-model="seriesDataTransform.type" @change="updateDataTransform($event)" id="select-data-transform" class="form-control">
                                    <option disabled value="">Elegir uno...</option>
                                    <option value="none">Ninguna</option>
                                    <option value="log">Logaritmo</option>
                                    <option value="multiply_by">Multiplicar por...</option>
                                </select>
                            </div>
                            <div class="col-4 d-flex" v-if="seriesDataTransform.type === 'multiply_by'">
                                <input type="search" class="form-control" v-model="seriesDataTransform.multiplyByValue">
                                <span class="input-group-btn">
                                    <button class="btn btn-secondary" type="button" @click.prevent="updateDataTransform($event)">
                                        <i class="fa fa-arrow-right"></i>
                                    </button>
                                </span>
                            </div>

                        </div>
                    </form>
                </div>
            </a>
        </div>
    </div>
</template>

<script>
    import _ from 'lodash'
    // import fecha from 'fecha'
    import bus from '../event-bus.js'
    // import Vue from 'vue'
    import {utilsMixin} from '../util.js'

    export default {
        name: 'EditSeries',
        mixins: [utilsMixin],
        mounted: function () {
        },
        data () {
            return {
                currentEditedSeriesId: null,
                seriesYAxis: null,
                representation_mode: null,
                seriesDataTransform: null,
                initialLoadReady: true,
                seriesFrequency: null
            }
        },
        computed: {
            seriesArray: function () {
                return bus.seriesArrayMeta
            },
            minimumPossibleTimeframeCollapse: function () {
                let self = this
                let freqNumber = _.map(self.seriesArray, (x) => { return self.frequencyStringToNumeric[x['indice_tiempo_frecuencia']] })
                return _.max(freqNumber)
            },
            availableDates: function () {
                return bus.getAvailableDates()
            }
        },
        methods: {
            updateChart: function () {
                this.initialLoadReady = !this.initialLoadReady
            },
            removeSeries: function (seriesId) {
                this.currentEditedSeriesId = null
                bus.removeSeriesMeta(seriesId)
            },
            editSeries: function (series) {
                let seriesId = series.internal_series_id
                if (this.currentEditedSeriesId === seriesId) {
                    this.currentEditedSeriesId = null
                } else {
                    this.seriesYAxis = series.yAxisIndex
                    this.representation_mode = series.representation_mode
                    this.seriesDataTransform = series.dataTransform

                    this.currentEditedSeriesId = seriesId
                }
            },
            updateYAxis: function () {
                bus.editSeriesMeta(this.currentEditedSeriesId, 'yAxisIndex', parseInt(this.seriesYAxis), false)
                this.updateDataTransform()
            },
            updateRepresentationMode: function (event) {
                if (this.moreOptionsNeededStatus(event)) {
                    // do nothing, more options needed
                } else {
                    const reDownloadData = (
                        this.representation_mode.type !== 'index_100' &&
                        this.representation_mode.type !== 'value_with_deflactor'
                    )
                    bus.editSeriesMeta(this.currentEditedSeriesId, 'representation_mode', this.representation_mode, reDownloadData)
                }
            },
            updateDataTransform: function (event) {
                if (!_.isFinite(parseFloat(this.seriesDataTransform.multiplyByValue))) {
                    this.seriesDataTransform.multiplyByValue = 1
                    return
                }
                if (this.moreOptionsNeededStatus(event)) {
                    // do nothing, more options needed
                } else {
                    bus.editSeriesMeta(this.currentEditedSeriesId, 'dataTransform', this.seriesDataTransform, false)
                }
            },
            moreOptionsNeededStatus: function (event) {
                let out = false
                if (event !== undefined) {
                    if (event.target.id === 'select-representation-mode' && this.representation_mode.type === 'index_100') {
                        out = true
                    }
                    if (event.target.id === 'select-data-transform' && this.seriesDataTransform.type === 'multiply_by') {
                        out = true
                    }
                }
                return out
            }
        }
    }
</script>

<style scoped>

</style>
