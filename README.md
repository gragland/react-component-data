# 🍯 React Component Data

Data fetching for universal React applications. Components declare the data they'd like to receive as props. Plays nicely with React Router.

## Usage

Install the package:

```bash
$ npm install react-component-data --save 
```

### Component

The only change you need to make to your component is to give it a `getData()` static method which returns an object containing the props that it would like to receive. On server-side render (and subsequent client-side render/re-hydration) your component will get those props on its initial mount. If a component is not rendered server-side its props will be fetched asyncronously and you can manage your component's loading state however you wish.

     
```jsx
import React from 'react';
    
class Component extends React.Component {

  static async getData(){
    const response = await fetchGithubRepos('gragland');
    return { projects: response.data };
  }
      
  static defaultProps = { projects: null };

  render() { 
    const projects = this.props.projects;

    { projects ? 
      <ProjectsList projects={projects} />
    :
      <LoadingSpinner />
    }
  }
}
```    
  

If you don't use async/await just return a Promise.
```jsx
static getData(){
  return new Promise((resolve, reject) => {
    fetchGithubRepos('gragland')
    .then((response) => {
      resolve({ projects: response.data });
    });
  });
}
```    
 We'll continue to use async/await in our examples but keep in mind that you can use standard Promises instead.

  
### Server
On the server-side you use `resolve()` to fetch your component's data and then pass the resulting data object as a prop to `<ComponentData>`.

```jsx
import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import ComponentData, { resolve } from 'react-component-data';
import Layout from './Layout.js';
import App from './App.js';

express()
.get('/', async function (req, res) {

  const data = await resolve(App);

  const body = renderToString( 
    <ComponentData data={data}>
      <App /> 
    </ComponentData>
  );

  res.send(
    renderToStaticMarkup( <Layout body={body} /> )
  );

}).listen( ... );
```
### Server (w/ React Router)

```jsx
import React from 'react';
import { renderToStaticMarkup, renderToString } from 'react-dom/server';
import { match, RouterContext } from 'react-router';
import ComponentData, { resolve } from 'react-component-data'; 
import routes from './routes.js';
import Layout from './Layout.js';

express()
.use((req, res, next) => {
  match(
    { routes: routes, location: req.url }, 
    async (error, redirectLocation, renderProps) => {

      const data = await resolve(RouterContext, renderProps);

      const body = renderToString( 
        <ComponentData data={data}>
          <RouterContext {...renderProps} /> 
        </ComponentData>
      );

      res.send(
        renderToStaticMarkup( <Layout body={body} /> )
      );
    }
 );
}).listen( ... );
```    
### Entry
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import ComponentData from 'react-component-data';
import App from './App.js';

ReactDOM.render(
  <ComponentData>
    <App />
  </ComponentData>,
  document.getElementById('app')
);
```
 


### Entry (w/ React Router)
```jsx
import React from 'react';
import ReactDOM from 'react-dom';
import { Router, browserHistory } from 'react-router';
import ComponentData from 'react-component-data';
import routes from './routes';

ReactDOM.render(
  <ComponentData>
    <Router history={browserHistory} routes={routes} />
  </ComponentData>,
  document.getElementById('app')
);
```



### 🌀 Recursive Resolve (experimental)
If you have nested components with data dependencies then you can use the recursive resolve method. Rather then just resolve data for the top level component (or route component when used with React Router), it will recursively iterate through your entire component tree, resolving each component's data dependency and calling its componentWillMount lifecycle method before moving farther down the tree. 
```   
import ComponentData, { resolve } from 'react-component-data/recursive';
```

When using the recursive resolver you'll also need to wrap each nested (but not top level) component that implements `getData()` with our Higher Order Component like so:
```jsx
import { withData } from 'react-component-data';

class NestedComponent extends React.Component { 
  ...
}

export default withData(NestedComponent);
```  
 

  
  
## Acknowledgements

- Inspired by the very awesome [Next.js](https://github.com/zeit/next.js) framework by [▲ZEIT](https://zeit.co/).
- Much of the recursive resolver code was gratiously copied from the [React Apollo](https://github.com/apollostack/react-apollo) project.

    
    





