import * as React from 'react';
import { TasksApi } from "../gen";

// function Welcome(props) {
//   return <h1>Hello, {props.name}</h1>;
// }
interface Props {
  name: string,
}
export const Welcome = (props: Props) => {
	const taskApi = new TasksApi();

	const onClick = async () => {
		const tasks = await taskApi.tasksGet();
		console.log(tasks);
	}

	return (
		<>
			<h1>Hello, {props.name}</h1>
			<button onClick={onClick}>click me!</button>
		</>
	)
}
