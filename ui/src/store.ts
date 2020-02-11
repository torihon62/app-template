import { createStore } from 'redux';
import { middlewares, reducers, runSaga } from './reducers';
// import appUIActions from './reducers/app-ui/actions';
export { history } from './reducers';

export const store = createStore(reducers, middlewares);

runSaga();

// store.dispatch(appUIActions.boot.started({}));
