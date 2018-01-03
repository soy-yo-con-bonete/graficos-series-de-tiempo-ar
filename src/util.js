/*
//  convert csv to array
let dataArray = data.split('\n').map((x) => { return x.split(',') })
//  Remove header, and last row if needed
dataArray = dataArray.slice(1)
dataArray = _.filter(dataArray, (x) => { return x.length >= 2 })
//  convert strings to date and numbers
dataArray = dataArray.map((x) => { return [x[0]].concat(x.slice(1).map(parseFloat)) })

//  convert to series object
let seriesIndex = 1
let series = dataArray.map(function (row) {
    let date = fecha.parse(row[0], 'YYYY-MM-DD')
    return [Date.UTC(date.getFullYear(), date.getMonth(), date.getDate())].concat(row.slice(seriesIndex, seriesIndex + 1))
})
console.log(series)
*/
import fecha from 'fecha'

export const utilsMixin = {
    data () {
        return {
            frequencyStringToNumeric: {
                'R/P1D': 1,
                'R/P1M': 30,
                'R/P3M': 90,
                'R/P6M': 180,
                'R/P1Y': 360
            }
        }
    },
    methods: {
        getReadableFrequency: function (freq) {
            let out
            switch (freq) {
            case 'R/P1D':
                out = 'Diario'
                break
            case 'R/P6M':
                out = 'Semestral'
                break
            case 'R/P3M':
                out = 'Trimestral'
                break
            case 'R/P1M':
                out = 'Mensual'
                break
            case 'R/P1Y':
                out = 'Anual'
                break
            }
            return out
        },
        getReadableRange: function (freq, start, end) {
            let startDate = fecha.parse(start, 'YYYY-MM-DD HH:mm:ss')
            let endDate = fecha.parse(end, 'YYYY-MM-DD HH:mm:ss')
            let out
            switch (freq) {
            case 'R/P1D':
                out = fecha.format(startDate, 'YYYY-MM-DD') + ' - ' + fecha.format(endDate, 'YYYY-MM-DD')
                break
            case 'R/P6M':
                out = startDate.getFullYear() + 'S' + (Math.floor(startDate.getMonth() / 6) + 1) +
                    ' - ' + endDate.getFullYear() + 'S' + (Math.floor(endDate.getMonth() / 6) + 1)
                break
            case 'R/P3M':
                out = startDate.getFullYear() + 'T' + (Math.floor(startDate.getMonth() / 3) + 1) +
                    ' - ' + endDate.getFullYear() + 'T' + (Math.floor(endDate.getMonth() / 3) + 1)
                break
            case 'R/P1M':
                out = fecha.format(startDate, 'YYYY-MM') + ' - ' + fecha.format(endDate, 'YYYY-MM')
                break
            case 'R/P1Y':
                out = fecha.format(startDate, 'YYYY') + '-' + fecha.format(endDate, 'YYYY')
                break
            }
            return out
        },
        getMinimumPossibleTimeframeCollapse: function (freqsArray) {

        }
    }
}
