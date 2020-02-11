import { takeEveryFsa } from "../helpers";
import { actions } from "./";
import { put, call } from "redux-saga/effects";
import { TasksApi, Task } from "../../../gen";
import { AxiosResponse } from "axios";

export function* tasksSaga() {
	yield takeEveryFsa(actions.init.started, function*(action) {

		yield put(actions.fetch.started({}));

		yield put(actions.init.done({
			params: {},
			result: {},
		}));
	});

	yield takeEveryFsa(actions.fetch.started, function*(action) {
		const taskApi = new TasksApi();

		const tasks: AxiosResponse<Task[]> = yield call(
			async () => {
				return await taskApi.tasksGet();
			}
		);

		yield put(actions.fetch.done({
			params: action.payload,
			result: tasks.data,
		}))
	});
}
