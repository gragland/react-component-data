import React from 'react';

// Tiny Promise polyfill
// Much smaller filesize then using async/await and transpiling
import Promise from 'promise-polyfill'; 

// JOB: give the component data, whether by getting it via context or by fetching it itself

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

    if (data){

      console.log('[RESOLVER Have props from context');

      this.setState({ data: data });

    }else if (isClient()){

      //console.log('[RESOLVER] No props');

      this.clientResolve()
    }

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

    if (element){
      element.remove();
    }

    return data;
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
      // Adding a key when props are added forces component to remount
      // Makes it easier since component doesn't need to implement componentWillReceiveProps to update
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

export default Resolver;
