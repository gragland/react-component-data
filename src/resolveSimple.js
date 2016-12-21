import React from 'react';
import Promise from 'promise-polyfill'; 

export function resolve(component, props) {

  const methodName = 'getData';

  if (!component.prototype || !component.prototype.isReactComponent) {
    throw new Error('[React Component Data] Resolve expects a valid react component');
  }

  const element = React.createElement(component, props);

  // If it's a component then call its data method
  if (element.type[methodName]){
    return Promise.resolve(element.type[methodName]());
  }

  if (!element.props.router){
    throw new Error('resolve() expects a React component or a React Router renderProps object');
  }

  const { components } = element.props;

  // Filter out null values
  const valid = components.filter((component) => component);

  if (!valid){
    return null;
  } 

  // Get components that have the data method
  const withFunction = valid.filter((component) => component[methodName]);

  if (!withFunction[0] || !withFunction[0][methodName]){
    return null;
  } 

  // Call the first component's data method
  // In the future we can consider fetching data for nested components
  return Promise.resolve(withFunction[0][methodName]());
}