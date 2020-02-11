import React from 'react';
import { ConnectedRouter } from 'connected-react-router';
import { history } from '../store';
import { Route, Switch } from 'react-router-dom';
import { componentDidMount, componentWillUnMount } from './helpers';
import { DispatchProp, connect } from 'react-redux';
import { actions as appUiActions } from '../reducers/app-ui';
import { selectors as tasksSelector } from '../reducers/tasks'
import { Task } from '../../gen';
import { StoreState } from '../reducers/types';

interface PropsFromStore {
	tasks: Task[];
}

const Root = (props: PropsFromStore & DispatchProp) => {
	componentDidMount(() => {
		props.dispatch(appUiActions.init.started({}));
	});

	componentWillUnMount(() => {
		console.log('unmount')
	})

	return (
		<ConnectedRouter history={history}>
			<Switch>
				<Route
					exact
					path="/"
					render={() => {
						return(
							<div>hello</div>
						);
					}}
				/>
				<Route
					path="/tasks"
					render={() => {
						return(
							<ul>
							{
								props.tasks.map(task => {
									return (
										<li key={`s${task.title}`}>title: {task.title}, done: {`${task.done}`}</li>
									)
								})
							}
							</ul>
						);
					}}
				/>
			</Switch>
		</ConnectedRouter>
	);
}

export default connect<PropsFromStore, {}, {}, StoreState>(state => ({
	tasks: tasksSelector.taskListSelector(state),
}))(Root);
