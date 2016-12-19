import React from 'react';
import * as ReactDOM from 'react-dom/server';
import flattenDeep from 'lodash/flattendeep';

//import assign = require('object-assign');
const assign = Object.assign;

// Recurse an React Element tree, running visitor on each element.
// If visitor returns `false`, don't call the element's render function
// or recurse into its child elements
export function walkTree(element, context, mergeProps, visitor) {
  const Component = element.type;

  if (typeof Component === 'function') {

    const props = assign({}, Component.defaultProps, element.props, (mergeProps || {}));

    let childContext = context;
    let child;

    // Are we are a react class?
    // https://github.com/facebook/react/blob/master/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L66
    if (Component.prototype && Component.prototype.isReactComponent) {

      const instance = new Component(props, context);

      // In case the user doesn't pass these to super in the constructor
      instance.props = instance.props || props;
      instance.context = instance.context || context;

   
      // Override setState to just change the state, not queue up an update.
      // We can't do the default React thing as we aren't mounted "properly"
      // however, we don't need to re-render as well only support setState in
      // componentWillMount, which happens *before* rendere.
      instance.setState = (newState) => {
        instance.state = assign({}, instance.state, newState);
      };

      // This is a poor man's version of
      // https://github.com/facebook/react/blob/master/src/renderers/shared/stack/reconciler/ReactCompositeComponent.js#L181
      if (instance.componentWillMount) {
        instance.componentWillMount();
      }

      if (instance.getChildContext) {
        childContext = assign({}, context, instance.getChildContext());
      }

      // Query we need to resolve first so stop traversing.
      if (visitor(element, instance, context) === false) {
        return;
      }

      child = instance.render();

    } else { // just a stateless functional

      // Query we need to resolve first so stop traversing.
      if (visitor(element, null, context) === false) {
        return;
      }

      child = Component(props, context);
    }


    if (child) {
      walkTree(child, childContext, null, visitor);
    }


  } else { // a basic string or dom element, just get children

    // Query we need to resolve first so stop traversing.
    if (visitor(element, null, context) === false) {
      return;
    }

    // Multiple children, traverse each one.
    if (element.props && element.props.children) {
      React.Children.forEach(element.props.children, (child) => {
        if (child) {
          walkTree(child, context, null, visitor);
        }
      });
    }
  }
}

function getQueriesFromTree(rootElement, rootContext, fetchRoot, mergeProps){

  const queries = [];

  const isStaticMethod = true;
  const methodName = 'getInitialProps';

  walkTree(rootElement, rootContext, mergeProps, (element, instance, context) => {

    // IMPORTANT: (element === rootElement) is what prevents this from being an endless loop
    // visitor() calls where element is passed in and it's the same as walkTree rootElement don't do anything
    // The ones that do something are the recursive walkTree within walkTree calls that then lead to new visitor() calls
    // This is because this function as rootElement in it's scope (and receives element, instance, context) 
    const skipRoot = !fetchRoot && (element === rootElement);

    if (skipRoot){
      return;
    }

    if ( (isStaticMethod && (element && element.type && typeof element.type[methodName] === 'function')) ||
          (!isStaticMethod && instance && typeof instance[methodName] === 'function')){

      const query = ( isStaticMethod ? element.type[methodName]() : instance[methodName]() );

      if (query) {
        queries.push({ query, element, context });

        // Tell walkTree to not recurse inside this component;  we will
        // wait for the query to execute before attempting it.
        return false;
      }
    }
  });

  return queries;
}


let queries_all = [];

const finalData = {};

// XXX component Cache
export function getDataFromTree(rootElement, rootContext, fetchRoot, mergeProps, isTopLevel){

  //console.log(`Now searching element (${rootElement.type.name || rootElement.type.displayName}):`, rootElement);

  // Get array of queries (fetchData promises) from tree
  // This will traverse down recursively looking for fetchData() methods
  let queries = getQueriesFromTree(rootElement, rootContext, fetchRoot, mergeProps);

  // No queries found. We're done!
  if (!queries.length) {
    return Promise.resolve();
  }

  queries_all.push(queries);

  // We've traversed down as far as possible in thecurrent tree branch ...
  // Wait on each query that we found, re-rendering the subtree when it's done.
  const mappedQueries = queries.map(({ query, element, context }) =>  {
    return query.then((newProps) => {
      // Add to finalData array that will be returned
      finalData[element.type.displayName] = newProps;
      // Traverse children
      // Component will use newProps returned by the query so we can find any children it might have as a result
      return getDataFromTree(element, context, false, newProps);
    })
  });

  return Promise.all(mappedQueries).then((values) => {
    // Only return final data at top level
    // Not inside recursive getDataFromTree calls
    if (isTopLevel){

      const data = { _resolverComponents: finalData };
      
      return data;

      /*
      const script = getScript(data);
      return { data: data, script: script };
      */
      
    }
  });
}

function getScript(data){
  return ( data && <script id='COMPONENT_DATA_PAYLOAD' type='application/json' dangerouslySetInnerHTML={{__html: safeStringify(data)}}></script> );
}

function safeStringify(obj){
  return (obj ? JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--') : null);
}


