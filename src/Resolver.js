import React from 'react';

// Tiny Promise polyfill
// Much smaller filesize then using async/await and transpiling
import Promise from 'promise-polyfill'; 

class Resolver extends React.PureComponent {

  constructor(props, context){
    super(props);
    this.state = {};
    this.clientResolve = this.clientResolve.bind(this);
    this.clientResolveFromComponent = this.clientResolveFromComponent.bind(this);
  }

  componentWillMount(){

    console.log('[RESOLVER] Mounted');

    const { data } = this.context;

    // SERVER
    if (data){
      console.log('[RESOLVER Have props from context');
      const props = this.getPropsFromData(data);
      this.setState({ data: props });
    // CLIENT
    }else if (isClient()){
      this.clientResolve()
    }

  }

  getPropsFromData(data){
    let props;

    // If we're using recursive resolve then components are indexed by displayName
    if (data && data._resolverComponents){

      const child = React.Children.only(this.props.children);
      const childName = child.type.displayName;
      props = data._resolverComponents[childName];

    // Otherwise data is the props
    // We can't normalize this because React Router renderProps doesn't give us the component instance
    }else{
      props = data;
    }

    return props;
  }

  clientResolve(){

    console.log('[RESOLVER] Resolving props client-side');

    let data = this.clientResolveFromDOM();

    if (data){
      this.setState({ data: data });
      console.log('[RESOLVER] Re-hydration was successful', data);
    }else{

      console.log('[RESOLVER] Re-hydration failed (no data)');

      this.clientResolveFromComponent()
      .then((data) => {
        if (data){
          console.log(`[RESOLVER] Resolved Component.${this.context.method}()`, data);
          this.setState({ data: data });
        }else{
          console.log(`[RESOLVER] Unable to resolve Component.${this.context.method}()`);
        }
      });
    }
  }


  clientResolveFromDOM(){
    const element = document.getElementById('COMPONENT_DATA_PAYLOAD');
    const data = (element ? JSON.parse(element.innerHTML) : null);
    return this.getPropsFromData(data);
  }

  // Call component's static method, save data to state, pass as props to child component
  clientResolveFromComponent(){
    const Component = React.Children.only(this.props.children);
    // Check if method is implemented
    if (Component.type[this.context.method]){
      // Support a promise or standard object by wrapping in Promise.resolve
      return Promise.resolve(Component.type[this.context.method]());
    }else{
      return Promise.resolve(null);
    }
  }

  render(){

    const Component = React.Children.only(this.props.children);

    if (this.state.data){
      const ComponentWithProps = React.cloneElement(Component, this.state.data);
      // Adding a key so component remounts
      // Easier because no need to implement componentWillReceiveProps
      const ComponentWithKey = React.cloneElement(ComponentWithProps, { key: 'hasInitialProps' });
      return ComponentWithKey;
    }else{
      return Component;
    }
  }
}

Resolver.contextTypes = {
  method: React.PropTypes.string,
  data: React.PropTypes.object
}

function isClient(){
  return typeof window !== 'undefined';
}


export const HOC = (WrappedComponent) => {
  return (props, context) => (

    <Resolver>
      <WrappedComponent {...props} />
    </Resolver>
    
  );
}


export default Resolver;
