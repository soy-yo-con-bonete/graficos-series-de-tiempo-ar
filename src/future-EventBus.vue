<template>
    <div></div>
</template>

<script>
    import Vue from 'vue'
    import axios from 'axios'
    import _ from 'lodash'

    export default {
        name: 'EventBus',
        template: '<div></div>',
        data () {
            return {
                seriesArrayMeta: [],
                rawData: {}
            }
        },
        watch: {
            seriesArrayMeta: function (newArray) {
                this.$emit('seriesArrayMetaChanged', newArray)
            }
        },
        methods: {
            downloadData: function () {
                if (this.seriesArrayMeta.length === 0) {
                    // If the array of series is empty, don't download new data. Instead emit an empty event.
                    this.$emit('seriesarrayisempty')
                } else {
                    let self = this

                    // Generar string para transformaciones y collapse al nivel de la serie
                    let idString = _.map(self.seriesArrayMeta, (seriesMeta) => {
                        // If we're using a custom representation_mode, adjust it to one the API can understand
                        let repMode
                        switch (seriesMeta.representation_mode.type) {
                            case 'index_100':
                                repMode = 'value'
                                break
                            default:
                                repMode = seriesMeta.representation_mode.type
                                break
                        }

                        return seriesMeta.serie_id + ':' + repMode
                    }).join(',')

                    self.$emit('before-loading-data-from-api')
                    axios.get('http://apis.datos.gob.ar/series/api/series/', {
                        params: {
                            ids: idString,
                            // collapse: 'quarter',
                            format: 'json',
                            limit: 1000
                        }
                    }).then(function (response) {
                        let data = response.data
                        window.data = data
                        self.rawData = {
                            original_data: _.cloneDeep(data.data),
                            transformed_data: _.cloneDeep(data.data),
                            seriesFrequency: data.meta[0].frequency,
                            params: _.cloneDeep(data.params)
                        }
                        self.applySeriesTransformations()
                    }).catch(function (error) {
                        console.log(error)
                    }).then(function () {
                        self.$emit('finished-loading-data-from-api')
                    })
                }
            },
            addSeriesMeta: function (newValue) {
                if (_.find(this.seriesArrayMeta, {serie_id: newValue.serie_id}) === undefined) { // check if this series already exists. If it does, don't add it
                    // Add an internal id so we can reference this item in other parts
                    let nextId = 1
                    if (this.seriesArrayMeta.length > 0) {
                        nextId = _.max(_.map(this.seriesArrayMeta, 'internal_series_id')) + 1
                    }
                    newValue.internal_series_id = nextId

                    // Set the default values for this new series
                    newValue.yAxisIndex = 0
                    newValue.representation_mode = {
                        type: 'value',
                        index100Date: null
                    }
                    newValue.dataTransform = {
                        type: 'none',
                        multiplyByValue: 1
                    }
                    newValue.serie_descripcion_transformada = newValue.serie_descripcion
                    newValue.serie_unidades_transformada = newValue.serie_unidades

                    // Push it into the main array
                    this.seriesArrayMeta.push(newValue)

                    // Download all data
                    this.downloadData()
                } else {
                    console.warn('Series was already included')
                }
            },
            removeSeriesMeta: function (seriesId) {
                let index = _.findIndex(this.seriesArrayMeta, {internal_series_id: seriesId})
                this.seriesArrayMeta.splice(index, 1)
                // Download all data
                this.downloadData()
            },
            editSeriesMeta: function (seriesId, key, newValue, reDownloadData) {
                let index = _.findIndex(this.seriesArrayMeta, {internal_series_id: seriesId})
                let thisMeta = this.seriesArrayMeta[index]
                thisMeta[key] = newValue
                Vue.set(this.seriesArrayMeta, index, thisMeta)

                if (reDownloadData === true) {
                    this.downloadData()
                } else {
                    this.applySeriesTransformations()
                }

                return 0
            },
            applySeriesTransformations: function () {
                let self = this
                _.map(self.seriesArrayMeta, 'internal_series_id').forEach(self.applySeriesTransformationsSingleSeries)
                this.updateMetaArrayWithTransformations()
                this.$emit('dataupdated', this.rawData, this.seriesArrayMeta)
            },
            applySeriesTransformationsSingleSeries: function (seriesId) {
                let self = this
                const seriesIndex = _.findIndex(self.seriesArrayMeta, {internal_series_id: seriesId})
                const thisSeriesMeta = self.seriesArrayMeta[seriesIndex]
                const thisDataTransform = thisSeriesMeta.dataTransform
                const thisRepresentationMode = thisSeriesMeta.representation_mode

                let multiplyByValueIndex100
                if (thisRepresentationMode.type === 'index_100') {
                    multiplyByValueIndex100 = self.getIndex100Factor(seriesId, thisRepresentationMode.index100Date)
                }

                for (let dateInd = 0; dateInd < self.rawData.transformed_data.length; dateInd++) {
                    const oldValue = self.rawData.original_data[dateInd][seriesIndex + 1] // the first element in the array for each day is the date itself, so we need to add 1
                    let newValue = _.clone(oldValue)

                    // First apply representation mode transformations
                    if (thisRepresentationMode.type === 'index_100') {
                        newValue = newValue * multiplyByValueIndex100
                    }
                    // Next apply custom transformations
                    if (thisDataTransform.type === 'log') {
                        newValue = Math.log(newValue)
                    } else if (thisDataTransform.type === 'none') {
                        // do nothing
                    } else if (thisDataTransform.type === 'multiply_by') {
                        newValue = newValue * thisDataTransform.multiplyByValue
                    }
                    // Check that value is good, otherwise set it to null
                    if (!_.isFinite(newValue) || oldValue === null) {
                        newValue = null
                    }

                    // Store the transformed value in the transformed_data array
                    self.rawData.transformed_data[dateInd][seriesIndex + 1] = newValue
                }
            },
            updateMetaArrayWithTransformations: function () {
                this.seriesArrayMeta = this.seriesArrayMeta.map(function (thisSeriesMeta, index) {
                    let newSeriesMeta = _.cloneDeep(thisSeriesMeta)
                    const thisDataTransform = thisSeriesMeta.dataTransform
                    const thisRepresentationMode = thisSeriesMeta.representation_mode

                    // First apply representation mode transformations
                    if (thisRepresentationMode.type === 'index_100') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion + ' (Re-indexado: ' + thisRepresentationMode.index100Date + '=100)'
                        newSeriesMeta.serie_unidades_transformada = newSeriesMeta.serie_unidades + ' (' + thisRepresentationMode.index100Date + '=100)'
                    } else if (thisRepresentationMode.type === 'change') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion + ' (Cambio)'
                    } else if (thisRepresentationMode.type === 'percent_change') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion + ' (% Cambio)'
                    } else if (thisRepresentationMode.type === 'percent_change_a_year_ago') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion + ' (% Cambio vs 1 año atrás)'
                    } else {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion
                        newSeriesMeta.serie_unidades_transformada = newSeriesMeta.serie_unidades
                    }

                    if (thisDataTransform.type === 'log') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion_transformada + ' (Log)'
                        newSeriesMeta.serie_unidades_transformada = 'Log (' + newSeriesMeta.serie_unidades_transformada + ')'
                    } else if (thisDataTransform.type === 'multiply_by') {
                        newSeriesMeta.serie_descripcion_transformada = newSeriesMeta.serie_descripcion_transformada + ' ( *' + Math.round(thisDataTransform.multiplyByValue * 10000) / 10000 + ')'
                    } else {
                        // do nothing, no more changes needed
                    }

                    return newSeriesMeta
                })
            },
            setAllMetaData: function (newMeta) {
                this.seriesArrayMeta = newMeta
                this.downloadData()
            },
            getAvailableDates: function () {
                return _.map(this.rawData.original_data, _.first)
            },
            getIndex100Factor: function (seriesId, targetDateString) {
                const seriesIndex = _.findIndex(this.seriesArrayMeta, {internal_series_id: seriesId})
                const theData = _.find(this.rawData.original_data, (x) => { return x[0] === targetDateString })
                if (theData !== undefined) {
                    return 100 / theData[seriesIndex + 1]
                } else {
                    console.warn('Could not find date to index by. Resetting units to value')
                    this.seriesArrayMeta[seriesIndex].representation_mode.type = 'value'
                    return 1
                }
            }
        }
    }

</script>
