import { createSelector } from 'reselect';
import { StoreState } from '../types';

const getList = (state: Pick<StoreState, 'tasks'>) => state.tasks.list;

export const selectors = {
	taskListSelector: createSelector(
		[getList],
		list => list,
	),
}
