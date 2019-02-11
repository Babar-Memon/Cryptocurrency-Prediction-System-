import React, { Component } from 'react';
import { Button, Card, Typography } from '@material-ui/core';
import { Line } from 'react-chartjs-2';
import { withStyles } from '@material-ui/core/styles/index';
import classNames from 'classnames';
import _ from 'lodash';

const styles = theme => ({
	root: {}
});

class Widget5 extends Component {
	state = {
		dataset: 'BTC',
		stepSize: 1000
	};

	setDataSet = dataset => {
		var stepSize;
		if (dataset === 'BTC') {
			stepSize = 1000;
		} else if (dataset === 'ETH') {
			stepSize = 100;
		} else {
			stepSize = 50;
		}
		this.setState({ dataset, stepSize });
	};

	render() {
		const { classes, data: dataRaw, theme } = this.props;
		const { dataset, stepSize } = this.state;
		const data = _.merge({}, dataRaw, {
			options: {
				scales: {
					yAxes: [
						{
							ticks: {
								stepSize: stepSize
							}
						}
					]
				}
			}
		});
		const dataWithColors = data.datasets[dataset].map((obj, index) => {
			const palette = theme.palette[index === 0 ? 'primary' : 'secondary'];
			return {
				...obj,
				borderColor: palette.main,
				pointBackgroundColor: palette.dark,
				pointHoverBackgroundColor: palette.main,
				pointBorderColor: palette.contrastText,
				pointHoverBorderColor: palette.contrastText
			};
		});
		return (
			<Card className={classNames(classes.root)} style={{ width: '80%' }}>
				<div className="relative p-24 flex flex-row items-center justify-between">
					<div className="flex flex-col">
						<Typography variant="subheading">
							CryptoCurrency Predictions
						</Typography>
					</div>
					<div className="flex flex-row items-center">
						{Object.keys(data.datasets).map(key => (
							<Button
								key={key}
								className="py-8 px-12"
								size="small"
								variant="contained"
								color="primary"
								style={{ color: '#FFF',marginLeft:'5%' }}
								onClick={() => this.setDataSet(key)}
								disabled={key === dataset}
							>
								{key}
							</Button>
						))}
					</div>
				</div>

				<Typography className="relative h-320 pb-16" style={{ color: '#FFF' }}>
					<Line
						data={{
							labels: data.labels,
							datasets: dataWithColors
						}}
						options={data.options}
					/>
				</Typography>
			</Card>
		);
	}
}

export default withStyles(styles, { withTheme: true })(Widget5);
