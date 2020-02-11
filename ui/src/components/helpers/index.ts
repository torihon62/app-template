import { useEffect } from 'react';

export const componentDidMount = (func: Function) => useEffect(() => { func() }, []);
export const componentWillUnMount = (func: Function) => useEffect(() => { return () => { func() } }, []);
