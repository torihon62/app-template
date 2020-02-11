import actionCreatorFactory from 'typescript-fsa';
import { Task } from '../../../gen';

const actionCreator = actionCreatorFactory('@@Tasks');

export const actions = {
	init: actionCreator.async<{}, {}>('INIT'),
	fetch: actionCreator.async<{}, Task[]>('FETCH'),
};

