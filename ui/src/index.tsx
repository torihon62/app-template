import * as React from 'react';
import * as ReactDOM from 'react-dom';
import { Welcome } from "./welcome";

const element = <Welcome name="torimoto" />;

ReactDOM.render(
  element,
  document.getElementById('root')
);
