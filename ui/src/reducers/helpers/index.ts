import { ActionCreator, Action, AnyAction, isType } from "typescript-fsa";
import { ForkEffect, takeEvery, call } from "redux-saga/effects";

export function takeEveryFsa<T>(
	ac: ActionCreator<T>,
	fn: (a: Action<T>) => any,
): ForkEffect {
	return takeEvery(ac.type, function*(action: AnyAction) {
		yield handleCommonFsaAction(action, ac, fn);
	});
}

function* handleCommonFsaAction<T>(
	action: AnyAction,
	ac: ActionCreator<T>,
	fn: (a: Action<T>) => any,
) {
	if (isType(action, ac)) {
		try {
			yield call(fn, action);
		} catch (e) {
			yield call(handleFsaActionError, e);
		}
	}
}

function* handleFsaActionError(e: Error) {
	console.error(e);
}
