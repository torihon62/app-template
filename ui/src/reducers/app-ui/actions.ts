import actionCreatorFactory from 'typescript-fsa';
// import { AppUIState } from './types';

const actionCreator = actionCreatorFactory('@@AppUI');

export const actions = {
	init: actionCreator.async<{}, {}>('INIT'),
};

