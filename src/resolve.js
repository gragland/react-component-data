import React from 'react';
import { resolveSimple } from './resolveSimple.js';
import { resolveRecursive } from './resolveRecursive.js';

export function resolve(component, props, recursive){

  if (!component.prototype || !component.prototype.isReactComponent) {
    throw new Error('[React Component Data] Resolve expects a valid react component');
  }

  const element = React.createElement(component, props);

  if (recursive){

    return resolveRecursive(element)
    .then((response) => {
        if (!response._resolverComponents)
          response = null;
        return response;
    });

  }else{
    return resolveSimple(element);
  }

}