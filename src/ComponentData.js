import React from 'react';
import Resolver, { HOC } from './Resolver.js';
import resolve from './resolve.js';
import { getDataFromTree, renderToStringWithData } from './apollo.js';

// JOB: Make data available via context and by rendering script tag to DOM
// The direct child must be <Router> or <RouterContext>
// It supplies <Router> with createElement(), which supplies the app component with an HOC.

// HOC immediately gets data via context for server-render and re-hydrates from script tag on client-render
// HOC will call Component.getInitialProps() if no data to re-hydrate from (navigated to the route client-side or disabled server data fetching)

class ComponentData extends React.PureComponent {

  getChildContext () {
    return {
      method: this.props.method,
      data: this.props.data
    };
  }

  render(){

    const { data, children } = this.props;
    const Child = React.Children.only(children);

    let NewChild;

    if (Child.type.displayName === 'Router' || Child.type.displayName === 'RouterContext'){
      NewChild = React.cloneElement(Child, { createElement: routerCreateElement() });
    }else{
      NewChild = wrapWithResolver(Child.type, Child.props);
    }

    return (
      <span>
        {NewChild}
      </span>
    );
  }
};

ComponentData.childContextTypes = {
  method: React.PropTypes.string,
  data: React.PropTypes.object
};

ComponentData.defaultProps = {
  method: 'getInitialProps',
  data: null
}

// Value for React Router createElement prop
// We use location key so that Resolver re-mounts on route change
function routerCreateElement() {
  return function(Component, props) {
    return wrapWithResolver(Component, props, props.location.key);
  }
}

function wrapWithResolver(Component, props, key){
  return (
    <Resolver key={key}>
      <Component {...props} />
    </Resolver>
  );
}

function safeStringify(obj){
  return JSON.stringify(obj).replace(/<\/script/g, '<\\/script').replace(/<!--/g, '<\\!--');
}

export default ComponentData;
export { HOC, Resolver, resolve, getDataFromTree };

