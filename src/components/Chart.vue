<template>
    <div>
        <div v-if="false" class="alert alert-primary" role="alert">
            Placeholder
        </div>
        <div style="text-align: right;"><button v-if="false" @click="updateChart">Test</button></div>
        <highstock v-if="initialLoadReady" :options="options" ref="highcharts"></highstock>

    </div>
</template>

<script>
    import _ from 'lodash'
    import fecha from 'fecha'
    import bus from '../event-bus.js'
    import Vue from 'vue'

    export default {
        name: 'Chart',
        mounted: function () {
            let self = this

            bus.$on('seriesarrayisempty', function () {
                Vue.set(self.options, 'series', [])
            })
            bus.$on('dataupdated', function (data, metaArray) {
                // Store data frequency //
                self.seriesFrequency = data.seriesFrequency

                //  convert to series object
                let seriesArray = []
                let dates = data.transformed_data.map((row) => {
                    let date = fecha.parse(row[0], 'YYYY-MM-DD')
                    return Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())
                })
                metaArray.forEach(function (thisSeriesMeta, seriesIndex) {
                    let thisSeries = {
                        name: thisSeriesMeta.serie_descripcion_transformada,
                        data: _.map(dates, (date, dateIndex) => { return [date, data.transformed_data[dateIndex][seriesIndex + 1]] }),
                        yAxis: thisSeriesMeta.yAxisIndex
                    }
                    seriesArray.push(thisSeries)
                })
                // console.log('Chart listened to new data, plotting it now. new seriesArray object')
                // console.log(seriesArray)

                // Set all options for Highcharts object
                Vue.set(self.options, 'series', seriesArray)
                Vue.set(self.options, 'xAxis', {
                    type: 'datetime',
                    labels: {
                        formatter: function () {
                            let defaultText = this.axis.defaultLabelFormatter.call(this)
                            // console.log( defaultText)
                            if (self.seriesFrequency === 'quarter' && /[a-zA-z]/.test(defaultText)) {
                                let d = new Date(this.value)
                                return d.getFullYear() + ' T' + (Math.floor(d.getMonth() / 3) + 1)
                            } else {
                                return defaultText
                            }
                        }
                    },
                    plotBands: [
                        {
                            from: Date.UTC(1994, 12, 1),
                            to: Date.UTC(1995, 8, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        },
                        {
                            from: Date.UTC(1998, 7, 1),
                            to: Date.UTC(2002, 4, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        },
                        {
                            from: Date.UTC(2008, 5, 1),
                            to: Date.UTC(2009, 4, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        },
                        {
                            from: Date.UTC(2011, 9, 1),
                            to: Date.UTC(2012, 4, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        },
                        {
                            from: Date.UTC(2013, 8, 1),
                            to: Date.UTC(2014, 8, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        },
                        {
                            from: Date.UTC(2015, 6, 1),
                            to: Date.UTC(2016, 10, 1),
                            color: 'rgba(10, 10, 10, .1)'
                        }
                    ]
                })
                Vue.set(self.options, 'tooltip', {
                    split: false,
                    formatter: function () {
                        let pointFormatString = '<span style="color:{point.color}">\u25CF</span> {series.name}: <b>{point.y}</b><br/>'
                        pointFormatString = pointFormatString.replace('{point.color}', this.point.color)
                        pointFormatString = pointFormatString.replace('{series.name}', this.series.name)
                        pointFormatString = pointFormatString.replace('{point.y}', this.point.y)

                        let dateString
                        let dateFormatString = '<span style="font-size: 10px">{point.key}</span><br/>'

                        let d = new Date(this.x)
                        if (self.seriesFrequency === 'quarter') {
                            dateString = d.getUTCFullYear() + ' T' + (Math.floor(d.getUTCMonth() / 3) + 1)
                        } else if (self.seriesFrequency === 'year') {
                            dateString = d.getUTCFullYear()
                        } else if (self.seriesFrequency === 'month') {
                            dateString = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2)
                        } else {
                            dateString = d.getUTCFullYear() + '-' + ('0' + (d.getUTCMonth() + 1)).slice(-2) +
                                '-' + ('0' + (d.getUTCDate() + 1)).slice(-2)
                        }
                        dateFormatString = dateFormatString.replace('{point.key}', dateString)
                        return dateFormatString + pointFormatString
                    }
                })
                Vue.set(self.options, 'yAxis', [
                    {
                        title: {
                            text: _.uniq(_.map(_.filter(metaArray, {yAxisIndex: 0}), 'serie_unidades_transformada')).join(', ')
                        },
                        opposite: false,
                        plotLines: [{
                            value: 0,
                            width: 1,
                            color: '#808080'
                        }]
                    },
                    {
                        title: {
                            text: _.uniq(_.map(_.filter(metaArray, {yAxisIndex: 1}), 'serie_unidades_transformada')).join(', ')
                        },
                        opposite: true,
                        plotLines: [{
                            value: 0,
                            width: 1,
                            color: '#808080'
                        }]
                    }]
                )
            })
        },
        computed: {
            highcharts: function () {
                // return this.$refs.highcharts.chart
            }
        },
        data () {
            return {
                initialLoadReady: true,
                seriesFrequency: null,
                options: {
                    chart: {
                        height: 500
                    },
                    exporting: {
                        enabled: true

                    },
                    legend: {
                        enabled: true,
                        layout: 'vertical',
                        align: 'center',
                        verticalAlign: 'bottom',
                        borderWidth: 0
                    },
                    rangeSelector: {
                        allButtonsEnabled: true,
                        buttons: [{
                            type: 'year',
                            count: 5,
                            text: '5y'
                        }, {
                            type: 'year',
                            count: 10,
                            text: '10y'
                        }, {
                            type: 'all',
                            text: 'Max'
                        }]
                    },
                    yAxis: [
                        {
                            title: {
                                text: ''
                            },
                            opposite: false,
                            plotLines: [{
                                value: 0,
                                width: 1,
                                color: '#808080'
                            }]
                        },
                        {
                            title: {
                                text: ''
                            },
                            opposite: true,
                            plotLines: [{
                                value: 0,
                                width: 1,
                                color: '#808080'
                            }]
                        }
                    ]

                }
            }
        },
        methods: {
        }

    }
</script>

<style scoped>

</style>
