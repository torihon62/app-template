import { createSelector } from 'reselect';
import { StoreState } from '../types';

const getReady = (state: Pick<StoreState, 'appUI'>) => state.appUI.ready;

export const selectors = {
	readySelector: createSelector(
		[getReady],
		ready => ready,
	),
}
