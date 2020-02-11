import { all, fork } from 'redux-saga/effects';
import { connectRouter, routerMiddleware } from 'connected-react-router';
import { createBrowserHistory } from 'history';
import { applyMiddleware, combineReducers } from 'redux';
import logger from 'redux-logger';
import createSagaMiddleware from 'redux-saga';
import { appUISaga, appUIReducer } from './app-ui';
import { tasksSaga, tasksReducer } from './tasks';

export const history = createBrowserHistory();

const sagaMiddleware = createSagaMiddleware();

export function runSaga() {
	sagaMiddleware.run(function*() {
		yield all([
			fork(appUISaga),
			fork(tasksSaga),
		]);
	});
}

export const middlewares = applyMiddleware(
	routerMiddleware(history),
	sagaMiddleware,
	logger,
);

export const reducers = combineReducers({
	router: connectRouter(history),
	appUI: appUIReducer,
	tasks: tasksReducer,
});
