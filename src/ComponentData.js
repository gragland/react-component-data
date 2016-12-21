import React from 'react';
import { Resolver } from './Resolver.js';
import { getScript, getScriptData, isClient } from './script.js';

/* 
  - Handles passing of data down the tree and re-hydration between server and client
  - Wraps child with <Resolver> which mediates getting data from this component via context or fetching it directly if not available ...
  - Or if child is React Router it adds the createElement hook to Router so that route components always get wrapped with <Resolver>
  - When rendered on the server:
    - Saves props.data to state and makes it available via context for <Resolver> components
    - Renders a <script> tag to the DOM that contains props.data (for client-side re-hydration)
  - When rendered on the client:
    - Gets <script> data from DOM (before DOM gets wiped by client-side render)
    - Saves <script> data to state and makes it available via context for <Resolver> components
  - TODO:
    - When browsing to different route the component gets original routes props added to it (since it gets data from context) ...
    ... We either need to (1) clear state before route change, (2) store an expiration time, or (3) always index data with a reliable key (component.displayname, etc)
    ... (2) might be the best for now because it also solves the issue of browsing back to the original route, but not wanting it to load its stale data
    ... When ComponentData hydrates have it set current time to state, then Resolvers can check to see how much time has passed.
    ... We could start always indexing and include the react router path. Maybe RRPATH_DISPLAYNAME. Then even if it was just "/_" it would at least be unique across routes.
    ... OR maybe even RRPATH_DISPLAYNAME_ROUNDEDTOCLOSESSECOND (NOPE wouldnt work since server time might be off);
*/

class ComponentData extends React.PureComponent {

  constructor(props, context){
    super(props);

    this.state = {
      data: null
    };
  }

  getChildContext () {
    return {
      method: this.props.method,
      data: this.state.data,
      time: this.state.time
    };
  }

  componentWillMount(){
    let data;
    let time;

    // If client-side grab <script> data from DOM before it's wiped clean
    // This way we don't have to require that the library user add the <script> tag themself
    if (isClient()){
      data = getScriptData();

      const d = new Date();
      time = d.getTime();

    // If server-side then we expect all data to be passed in as a prop
    }else{
      data = this.props.data;
    }

    if (data){
      this.setState({ 
        data: data,
        time: time
      });
    }
  }

  render(){

    const { data } = this.state;

    const { children } = this.props;
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
        { data && 
          <span>{getScript(data)}</span> 
        }
      </span>
    );
  }
};

ComponentData.childContextTypes = {
  method: React.PropTypes.string,
  data: React.PropTypes.object,
  time: React.PropTypes.number
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

function wrapWithResolver(WrappedComponent, props, key){
  return (
    <Resolver key={key} mainComponent={true}>
      <WrappedComponent {...props} />
    </Resolver>
  );
}

// HOC (added manually to nested components)
// TODO: Merge with wrapWithResolver()
const withData = (WrappedComponent) => {
  return (props, context) => (
    <Resolver>
      <WrappedComponent {...props} />
    </Resolver>
  );
}


export { ComponentData, withData };
