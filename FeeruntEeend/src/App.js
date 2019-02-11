import React, { Component } from 'react';
import './App.css';
import Chart from './components/Chart';
import axios from 'axios';
import { CircularProgress } from '@material-ui/core';

class App extends Component {
	constructor(props) {
		super(props);
		this.state = {
			load: true,
			data: null
		};
	}
	componentDidMount() {
		axios.get('http://localhost:3000/api/getPrediction').then(res => {
			this.setState({
				load: false,
				data: res.data.data
			});
		});
	}

	render() {
		const { load, data } = this.state;
		if (load) {
			return <CircularProgress style={{ position: 'absolute', top: '50%', left: '50%' }} />;
		}
		return (
			<div>
				<header className="App-header">
					<Chart data={data} />
				</header>
			</div>
		);
	}
}

export default App;
