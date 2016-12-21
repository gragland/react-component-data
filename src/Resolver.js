import React from 'react';
import { isClient } from './script.js';

// Tiny Promise polyfill
// Much smaller filesize then using async/await and transpiling
import Promise from 'promise-polyfill'; 

export class Resolver extends React.PureComponent {

  constructor(props, context){
    super(props);

    this.state = {
      propsForChild: null
    };

    this.log = this.log.bind(this);
    this.clientResolveFromComponent = this.clientResolveFromComponent.bind(this);
  }

  componentWillMount(){

    this.log('Mounted');

    let propsForChild;

    // Grab data object via context
    const data  = (this.context ? this.context.data : null);

    if (data){

      this.log('Have data via context', data);

      // Get props for the child component out of data
      propsForChild = this.getPropsFromData(data);

      if (propsForChild){
        this.log('Have props from data', propsForChild);
        this.setState({ propsForChild: propsForChild });
      }else{
        this.log('No props from data');
      }

    }else{

      this.log('No data via context');

    }

    // If we're client-size and don't have props then fetch them via child Component.method()
    //
    if (!propsForChild && isClient()){
      this.clientResolveFromComponent()
      .then((propsForChild) => {
        if (propsForChild){
          this.log(`Resolved Component.${this.context.method}()`, propsForChild);
          this.setState({ propsForChild: propsForChild });
        }else{
          this.log(`Unable to resolve Component.${this.context.method}()`);
        }
      });
    }

  }

  getChildName(){
    const child = React.Children.only(this.props.children);
    return child.type.displayName;
  }

  log(message, object){
    const string = `[RESOLVER - ${this.getChildName()}] ${message}`;
    if (object && isClient()){
      console.log(string, object);
    }else{
      console.log(string);
    }
  }

  getPropsFromData(data){
    let props;

    const { time } = this.context;

    const { mainComponent } = this.props;

    // If more then 0.5 seconds has passed since data was made available via ComponentData context then consider it expired.
    // Re-hydration should realistically take around 1/100th of a second
    // Kinda hacky but this prevents context data from being used when browsing to a new route
    // Once we have a reliable way to index data by a unique component id then this won't be needed ...
    // ... unless we still want to have data expire after a certain amount of time (such as when we browse to a new route and then back)
    const d = new Date();
    const currTime = d.getTime();
    if (currTime - time > 500){
      return null;
    }

    // If data._resolverComponents exists that means we are using our recursive resolver
    // All components data will be indexed by component displayName
    // TODO: Figure out a better index (combine multiple object properties, maybe all props?)
    if (data && data._resolverComponents){

      props = data._resolverComponents[this.getChildName()];

    // If not using our recursive resolver and this is the mainComponent.
    // This prevents child components using our withData HOC from being given the same props as the main component ...
    // ... and forces them to fetch their own data client-side. When recursive is off we don't ....
    // ... index data by component.displayName so we need a way for child component to know it's not their data.
    }else if (data && mainComponent === true){
      props = data;
    }else{
      props = null;
    }

    return props;
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

    const { children } = this.props;
    const { propsForChild } = this.state;

    const Component = React.Children.only(children);

    if (propsForChild){
      const ComponentWithProps = React.cloneElement(Component, propsForChild);
      // Adding a key so component remounts
      // Easier because no need to implement componentWillReceiveProps
      const ComponentWithKey = React.cloneElement(ComponentWithProps, { key: 'hasInitialProps' });
      return ComponentWithKey;
    }else{
      return Component;
    }
  }
}

Resolver.defaultProps = {
  mainComponent: false
}

Resolver.contextTypes = {
  method: React.PropTypes.string,
  data: React.PropTypes.object,
  time: React.PropTypes.number
}


