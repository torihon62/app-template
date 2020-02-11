import actionCreatorFactory from 'typescript-fsa';
import { TaskResponseBody } from '../../../gen';

const actionCreator = actionCreatorFactory('@@Tasks');

export const actions = {
	init: actionCreator.async<{}, {}>('INIT'),
	fetch: actionCreator.async<{}, TaskResponseBody[]>('FETCH'),
};

