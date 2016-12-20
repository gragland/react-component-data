import Promise from 'promise-polyfill'; 

export function resolveSimple(element) {

  // If it's a component then call getInitialProps()
  if (element.type.getInitialProps){
    return Promise.resolve(element.type.getInitialProps());
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

  // Get components that have the getInitialProps static method
  const withFunction = valid.filter((component) => component.getInitialProps);

  if (!withFunction[0] || !withFunction[0].getInitialProps){
    return null;
  } 

  // Call the first component's getInitialProps method
  // In the future we can consider fetching data for nested components
  return Promise.resolve(withFunction[0].getInitialProps());
}