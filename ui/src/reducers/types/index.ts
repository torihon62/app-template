import { AppUIState } from "../app-ui/types";
import { TasksState } from "../tasks/types";

export interface StoreState {
	appUI: AppUIState;
	tasks: TasksState;
}
