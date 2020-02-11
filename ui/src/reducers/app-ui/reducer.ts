import { AppUIState } from './types';
import { Action } from 'redux';
import { isType } from 'typescript-fsa';
import { actions } from './';


const initialState: AppUIState = {
	ready: true,
};

export function appUIReducer(state = initialState, action: Action): AppUIState {
	if (isType(action, actions.init.started)) {
		return {
			...state,
			ready: false,
		}
	}
	if (isType(action, actions.init.done)) {
		return {
			...state,
			ready: true,
		}
	}
	return state;
}
