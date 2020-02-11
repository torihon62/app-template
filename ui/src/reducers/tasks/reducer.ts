import { TasksState } from './types';
import { Action } from 'redux';
import { isType } from 'typescript-fsa';
import { actions } from './';

const initialState: TasksState = {
	list: [],
};

export function tasksReducer(state = initialState, action: Action): TasksState {
	if (isType(action, actions.fetch.done)) {
		return {
			...state,
			list: action.payload.result,
		}
	}
	return state;
}
