module.exports = {
	widget: {
		chartType: 'line',
		datasets: {
			BTC: [
				{
					label: 'Price',
					data: [190, 300, 340, 220, 290, 390, 250, 380, 410, 380, 320, 290],
					fill: 'start'
				},
				{
					label: 'Prediction',
					data: [300, 340, 410, 380, 220, 320, 290, 190, 290, 390, 250, 380],
					fill: 'start'
				}
			],
			ETH: [
				{
					label: 'Price',
					data: [190, 300, 340, 220, 290, 390, 250, 380, 410, 380, 320, 290],
					fill: 'start'
				},
				{
					label: 'Predictions',
					data: [2200, 2900, 3900, 2500, 3800, 3200, 2900, 1900, 3000, 3400, 4100, 3800],
					fill: 'start'
				}
			],
			LTC: [
				{
					label: 'Price',
					data: [410, 380, 320, 290, 190, 390, 250, 380, 300, 340, 220, 290],
					fill: 'start'
				},
				{
					label: 'Predictions',
					data: [3000, 3400, 4100, 3800, 2200, 3200, 2900, 1900, 2900, 3900, 2500, 3800],
					fill: 'start'
				}
			]
		},
		labels: [
			"Mar'18",
			"Apr'18",
			"May'18",
			"Jun'18",
			"Jul'18",
			"Aug'18",
			"Sep'18",
			"Oct'18",
			"Nov'18",
			"Dec'18",
			"Jan'19",
			"feb'19"
			],
		options: {
			spanGaps: false,
			legend: {
				display: false
			},
			maintainAspectRatio: false,
			tooltips: {
				position: 'nearest',
				mode: 'index',
				intersect: false
			},
			layout: {
				padding: {
					left: 24,
					right: 32
				}
			},
			elements: {
				point: {
					radius: 4,
					borderWidth: 2,
					hoverRadius: 4,
					hoverBorderWidth: 2
				}
			},
			scales: {
				xAxes: [
					{
						gridLines: {
							display: false
						},
						ticks: {
							fontColor: 'black'
						}
					}
				],
				yAxes: [
					{
						gridLines: {
							tickMarkLength: 16
						},
						ticks: {
							stepSize: 1000
						}
					}
				]
			},
			plugins: {
				filler: {
					propagate: false
				}
			}
		}
	}
};
