// import { TempState } from './types';
// import { Action } from 'redux';
// import { isType } from 'typescript-fsa';
// import { actions } from './';


// const initialState: TempState = {
// 	ready: true,
// };

// export function tempReducer(state = initialState, action: Action): TempState {
// 	if (isType(action, actions.init.started)) {
// 		return {
// 			...state,
// 			ready: false,
// 		}
// 	}
// 	if (isType(action, actions.init.done)) {
// 		return {
// 			...state,
// 			ready: true,
// 		}
// 	}
// 	return state;
// }
