// Configura Firebase
const firebaseConfig = {
    apiKey: "AIzaSyBrflP6KokS5pPjiUQPgg4whNKDE2ufkoA",
    authDomain: "wp-video-36594.firebaseapp.com",
    databaseURL: "https://wp-video-36594.firebaseio.com",
    projectId: "wp-video-36594",
    storageBucket: "wp-video-36594.appspot.com",
    messagingSenderId: "852768223035",
    appId: "1:852768223035:web:7def7f17edb497a478911e"
  };
  const app = firebase.initializeApp(firebaseConfig);
  const db = firebase.database(); // Ahora usamos firebase.database()
  const auth = firebase.auth();
  
  // Inicializa TinyMCE
  tinymce.init({
      selector: 'textarea#content',
      plugins: 'lists',
      toolbar: 'undo redo | bold italic | bullist numlist'
  });
  
  // Maneja la autenticación
  const loginBtn = document.getElementById('login-btn');
  const createPostBtn = document.getElementById('create-post-btn');
  const myPostsBtn = document.getElementById('my-posts-btn');
  const logoutBtn = document.getElementById('logout-btn');
  
  auth.onAuthStateChanged(user => {
      if (user) {
          // Usuario autenticado
          console.log('Usuario autenticado:', user);
          loginBtn.style.display = 'none';
          createPostBtn.style.display = 'inline-block';
          myPostsBtn.style.display = 'inline-block';
          logoutBtn.style.display = 'inline-block';
      } else {
          // Usuario no autenticado
          console.log('Usuario no autenticado');
          loginBtn.style.display = 'inline-block';
          createPostBtn.style.display = 'none';
          myPostsBtn.style.display = 'none';
          logoutBtn.style.display = 'none';
      }
  });
  
  // Iniciar sesión con Google
  loginBtn.addEventListener('click', () => {
      const provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider);
  });
  
  // Cerrar sesión
  logoutBtn.addEventListener('click', () => {
      auth.signOut();
  });
  
  // Variables para la paginación
  const postsPerPage = 5;
  let currentPage = 1;
  
  // Elementos del DOM para la paginación
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const postList = document.getElementById('post-list');
  
  // Función para actualizar la lista de posts
  function updatePosts() {
      postList.innerHTML = '';
  
      db.ref('posts').orderByChild('timestamp')
          .limitToLast(postsPerPage)
          .once('value', snapshot => {
              if (snapshot.val() === null) {
                  postList.innerHTML = '<p>No hay posts disponibles.</p>';
              } else {
                  const posts = snapshot.val();
                  const postKeys = Object.keys(posts);
  
                  for (let i = postKeys.length - 1; i >= 0 && i >= postKeys.length - postsPerPage; i--) {
                      const postId = postKeys[i];
                      const post = posts[postId];
                      const postItem = `
                          <div class="post-item" data-post-id="${postId}" data-post-author="${post.authorUid}">
                              <h3>${post.title}</h3>
                              <p>${post.content.substring(0, 100)}...</p>
                          </div>
                      `;
                      postList.innerHTML += postItem;
                  }
                  updatePagination();
              }
          })
          .catch(error => {
              console.error('Error al obtener los posts:', error);
          });
  }
  
  // Función para actualizar la paginación
  function updatePagination() {
      prevBtn.disabled = currentPage === 1;
      nextBtn.disabled = false;
  
      db.ref('posts').orderByChild('timestamp').limitToLast(postsPerPage)
          .once('value', snapshot => {
              nextBtn.disabled = snapshot.numChildren() < postsPerPage;
          });
  }
  
  // Función para manejar el evento "click" en un post
  postList.addEventListener('click', event => {
      if (event.target.classList.contains('post-item')) {
          const postId = event.target.dataset.postId;
          window.location.href = `post.html?id=${postId}`;
      }
  });
  
  // Función para crear un nuevo post
  const newPostForm = document.getElementById('new-post-form');
  newPostForm.addEventListener('submit', event => {
      event.preventDefault();
  
      const title = document.getElementById('title').value;
      const content = tinymce.get('content').getContent();
      const authorUid = auth.currentUser.uid;
  
      const newPost = {
          title: title,
          content: content,
          authorUid: authorUid,
          timestamp: firebase.database.ServerValue.TIMESTAMP
      };
  
      db.ref('posts').push(newPost)
          .then(docRef => {
              console.log('Post creado con ID:', docRef.key);
              window.location.href = 'index.html';
          })
          .catch(error => {
              console.error('Error al crear el post:', error);
          });
  });
  
  // Función para obtener el post por su ID
  const postId = new URLSearchParams(window.location.search).get('id');
  
  if (postId) {
      // Obtener el post por su ID
      db.ref(`posts/${postId}`).once('value', snapshot => {
          if (snapshot.val() !== null) {
              const post = snapshot.val();
              document.getElementById('post-title').textContent = post.title;
              document.getElementById('post-content').innerHTML = post.content;
              const postActions = document.getElementById('post-actions');
              if (auth.currentUser && post.authorUid === auth.currentUser.uid) {
                  postActions.style.display = 'flex';
              }
          } else {
              console.log('El post no existe');
          }
      })
      .catch(error => {
          console.error('Error al obtener el post:', error);
      });
  }
  
  // Función para editar un post
  const editBtn = document.getElementById('edit-btn');
  editBtn.addEventListener('click', () => {
      const postId = new URLSearchParams(window.location.search).get('id');
  
      db.ref(`posts/${postId}`).once('value', snapshot => {
          if (snapshot.val() !== null) {
              const post = snapshot.val();
  
              // Prepara el formulario para la edición
              document.getElementById('title').value = post.title;
              tinymce.get('content').setContent(post.content);
  
              // Cambia el comportamiento del botón "Publicar" para actualizar el post
              newPostForm.addEventListener('submit', event => {
                  event.preventDefault();
  
                  const title = document.getElementById('title').value;
                  const content = tinymce.get('content').getContent();
  
                  db.ref(`posts/${postId}`).update({
                      title: title,
                      content: content
                  })
                      .then(() => {
                          console.log('Post actualizado');
                          window.location.href = `post.html?id=${postId}`;
                      })
                      .catch(error => {
                          console.error('Error al actualizar el post:', error);
                      });
              });
          }
      });
  });
  
  // Función para eliminar un post
  const deleteBtn = document.getElementById('delete-btn');
  deleteBtn.addEventListener('click', () => {
      const postId = new URLSearchParams(window.location.search).get('id');
  
      if (confirm('¿Estás seguro de que quieres eliminar este post?')) {
          db.ref(`posts/${postId}`).remove()
              .then(() => {
                  console.log('Post eliminado');
                  window.location.href = 'index.html';
              })
              .catch(error => {
                  console.error('Error al eliminar el post:', error);
              });
      }
  });
  
  // Función para obtener los posts del usuario actual
  myPostsBtn.addEventListener('click', () => {
      window.location.href = 'mis-post.html';
  });
  
  // Mostrar los posts del usuario actual en mis-post.html
  const myPostList = document.getElementById('my-post-list');
  
  if (window.location.pathname.includes('mis-post.html')) {
      db.ref('posts').orderByChild('timestamp')
          .once('value', snapshot => {
              if (snapshot.val() === null) {
                  myPostList.innerHTML = '<p>No has creado ningún post aún.</p>';
              } else {
                  const posts = snapshot.val();
                  const postKeys = Object.keys(posts);
  
                  for (let i = 0; i < postKeys.length; i++) {
                      const postId = postKeys[i];
                      const post = posts[postId];
                      if (post.authorUid === auth.currentUser.uid) {
                          const postItem = `
                              <div class="post-item" data-post-id="${postId}" data-post-author="${post.authorUid}">
                                  <h3>${post.title}</h3>
                                  <p>${post.content.substring(0, 100)}...</p>
                              </div>
                          `;
                          myPostList.innerHTML += postItem;
                      }
                  }
              }
          })
          .catch(error => {
              console.error('Error al obtener los posts del usuario:', error);
          });
  }
  
  // Eventos de paginación
  prevBtn.addEventListener('click', () => {
      currentPage--;
      updatePosts();
  });
  
  nextBtn.addEventListener('click', () => {
      currentPage++;
      updatePosts();
  });
  
  // Llamada inicial para actualizar la lista de posts
  updatePosts();