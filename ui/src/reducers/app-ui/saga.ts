import { takeEveryFsa } from "../helpers";
import { actions } from "./";
import { actions as tasksActions } from "../tasks"
import { put, take } from "redux-saga/effects";

export function* appUISaga() {
	yield takeEveryFsa(actions.init.started, function*(action) {
		// initの処理
		yield put(tasksActions.init.started({}));
		yield take(tasksActions.init.done);
		
		yield put(actions.init.done({
			params: {},
			result: {},
		}));
	});
}
