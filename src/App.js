//App.js

import React, { useState, useEffect } from "react";
import {
  HashRouter,
  Switch,
  Route
} from "react-router-dom";
import { withAuthenticator } from '@aws-amplify/ui-react';
import { css } from '@emotion/css';
import { API, Storage, Auth } from 'aws-amplify';
import '@aws-amplify/ui-react/styles.css';
import { listPosts } from './graphql/queries';

import Posts from './Posts';
import Post from './Post';
import Header from './Header';
import CreatePost from './CreatePost';
import Button from './Button';




function Router({user, signOut}) {

  /* create a couple of pieces of initial state */
  const [showOverlay, updateOverlayVisibility] = useState(false);
  const [posts, updatePosts] = useState([]);
  const [myPosts, updateMyPosts] = useState([]);

  /* fetch posts when component loads */
  useEffect(() => {
      fetchPosts();
  }, []);

  async function fetchPosts() {

    /* query the API, ask for 100 items */
    let postData = await API.graphql({ query: listPosts, variables: { limit: 100 }});
    let postsArray = postData.data.listPosts.items;

    /* map over the image keys in the posts array, get signed image URLs for each image */
    postsArray = await Promise.all(postsArray.map(async post => {
      const imageKey = await Storage.get(post.image);
      post.image = imageKey;
      return post;
    }));

    /* update the posts array in the local state */
    setPostState(postsArray);
  }
  
 async function setPostState(postsArray) {
  const user = await Auth.currentAuthenticatedUser();
  const myPostData = postsArray.filter((p) => p.owner === user.username);
  updateMyPosts(myPostData);
  updatePosts(postsArray);
}


  return (
    <>
      <HashRouter>
          <div className={contentStyle}>
            <Header />
            <hr className={dividerStyle} />
            <Button title="New Post" onClick={() => updateOverlayVisibility(true)} />
            <Switch>
              <Route exact path="/" >
                <Posts posts={posts} />
              </Route>
              <Route path="/post/:id" >
                <Post />
              </Route>
              <Route exact path="/myposts">
                <Posts posts={myPosts} />
              </Route>

            </Switch>
          </div>
          <button onClick={signOut}>Sign out</button>
        </HashRouter>
        { showOverlay && (
          <CreatePost
            updateOverlayVisibility={updateOverlayVisibility}
            updatePosts={setPostState}
            posts={posts}
          />
        )}
    </>
  );
}

const dividerStyle = css`
  margin-top: 15px;
`

const contentStyle = css`
  min-height: calc(100vh - 45px);
  padding: 0px 40px;
`

export default withAuthenticator(Router);


// function App({ signOut, user }) {
//   const [posts, setPosts] = useState([]);
//   useEffect(() => {
//     fetchPosts();
//     checkUser(); // new function call
//   }, []);
//   async function fetchPosts() {
//     try {
//       const postData = await API.graphql({ query: listPosts });
//       setPosts(postData.data.listPosts.items);
//     } catch (err) {
//       console.log({ err });
//     }
//   }
//   //define the checkUser function after the existing fetchPosts() function
//   async function checkUser() {
//     const user = await Auth.currentAuthenticatedUser();
//     console.log("user:", user);
//     console.log("user attributes: ", user.attributes);
//   }
//   return (
//     <div>
//       <h1>Hello World</h1>
//       {posts.map((post) => (
//         <div key={post.id}>
//           <h3>{post.name}</h3>
//           <p>{post.location}</p>
//           <p>{post.description}</p>
//           <button onClick={signOut}>Sign out</button>
//         </div>
//       ))}
//     </div>
//   );
// }
// export default withAuthenticator(App);

