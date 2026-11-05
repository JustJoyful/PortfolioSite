let engine = null;
export const setEngine = (e) => { engine = e; window.dispatchEvent(new CustomEvent('engine:change')); };
export const getEngine = () => engine;
