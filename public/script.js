async function register() {
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;
  const response = await fetch('/register', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const result = await response.json();
  if (result.success) {
    alert('Registration successful! Automatically logged in.');
    document.getElementById('auth').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'block';
    getMessages();
  } else {
    alert(result.message || 'Registration failed');
  }
}

async function postMessage() {
  const messageInput = document.getElementById('messageInput');
  const message = messageInput.value.trim();
  if (message === '') {
    alert('Please enter a message before posting!');
    return;
  }
  const response = await fetch('/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  if (response.ok) {
    messageInput.value = '';
    getMessages(); // Reload messages to show the updated list
  } else {
    alert('Failed to post message.');
  }
}

async function getMessages() {
  try {
    const response = await fetch('/messages');
    console.log('Fetching messages...');

    if (!response.ok) {
      console.error('Failed to retrieve messages:', response.statusText);
      setBannerVisibility('block');
      return;
    }

    const messages = await response.json();
    console.log('Messages fetched successfully:', messages);

    const messagesList = document.getElementById('messagesList');
    messagesList.innerHTML = '';

    messages.forEach((message) => {
      const li = document.createElement('li');
      li.textContent = `${message.userId.username}: ${message.content}`;
      messagesList.appendChild(li);
    });

    console.log('Setting error banner to hide');
    setBannerVisibility('none'); // Hide the error banner successfully
  } catch (err) {
    console.error('Network error while fetching messages:', err);
    setBannerVisibility('block');
  }
}

function setBannerVisibility(displayState) {
  const errorBanner = document.getElementById('errorBanner');
  console.log('Setting error banner display to:', displayState);
  errorBanner.style.display = displayState;
}

// Call getMessages initially to load messages
getMessages();

document.getElementById('postButton').addEventListener('click', postMessage);

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;
  const response = await fetch('/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password })
  });
  const result = await response.json();
  if (result.success) {
    document.getElementById('auth').style.display = 'none';
    document.getElementById('logoutButton').style.display = 'block';
    alert('Login successful!');
    getMessages(); // Reload messages after login
  } else {
    alert(result.message || 'Login failed');
  }
}

async function logout() {
  const response = await fetch('/logout', { method: 'POST' });
  const result = await response.json();
  if (result.success) {
    document.getElementById('auth').style.display = 'block';
    document.getElementById('logoutButton').style.display = 'none';
    alert('Logged out!');
  } else {
    alert('Logout failed');
  }
}

// Load messages when the page loads
getMessages();

async function fetchPosts() {
  const response = await fetch('/posts');
  const posts = await response.json();

  const postsList = document.getElementById('postsList');
  postsList.innerHTML = '';

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.textContent = `${post.userId.username}: ${post.title} - ${post.content}`;
    postsList.appendChild(li);
  });
}

async function createPost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title || !content) {
    alert('Please fill out both title and content to submit a post.');
    return;
  }

  const response = await fetch('/posts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, content }),
  });

  if (response.ok) {
    document.getElementById('postTitle').value = '';
    document.getElementById('postContent').value = '';
    fetchPosts(); // Reload posts to show the new post
  } else {
    alert('Failed to create post.');
  }
}

document.getElementById('createPostButton').addEventListener('click', createPost);

// Initially load posts
fetchPosts();

async function createPost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();

  if (!title || !content) {
    alert('Please fill out both title and content to submit a post.');
    return;
  }

  console.log('Creating post:', { title, content }); // Debug: Log data

  try {
    const response = await fetch('/posts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title, content }),
    });

    console.log('Post response:', response); // Debug: Log response

    if (response.ok) {
      document.getElementById('postTitle').value = '';
      document.getElementById('postContent').value = '';
      fetchPosts(); // Reload posts to show the new post
    } else {
      alert('Failed to create post.');
    }
  } catch (error) {
    console.error('Error creating post:', error); // Handle fetch error
    alert('An error occurred while creating the post.');
  }
}

async function fetchPosts() {
  const response = await fetch('/posts');
  const posts = await response.json();

  const postsList = document.getElementById('postsList');
  postsList.innerHTML = '';

  posts.forEach((post) => {
    const postItem = document.createElement('li');
    postItem.className = 'list-group-item';
    postItem.innerHTML = `
      <h5>${post.userId.username}: ${post.title}</h5>
      <p>${post.content}</p>
      <div>
        <textarea class="form-control mb-2" placeholder="Write a reply" id="replyContent-${post._id}"></textarea>
        <button class="btn btn-primary btn-sm" onclick="addReply('${post._id}')">Reply</button>
      </div>
      <ul id="repliesList-${post._id}" class="list-group mt-2"></ul>
    `;
    postsList.appendChild(postItem);
    fetchReplies(post._id); // Fetch replies for each post
  });
}

async function addReply(postId) {
  const replyContent = document.getElementById(`replyContent-${postId}`).value.trim();
  if (!replyContent) {
    alert('A reply cannot be empty');
    return;
  }

  const response = await fetch(`/posts/${postId}/replies`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ content: replyContent }),
  });

  if (response.ok) {
    fetchReplies(postId); // Reload replies to show the new reply
    document.getElementById(`replyContent-${postId}`).value = ''; // Clear the input field
  } else {
    alert('Failed to add reply.');
  }
}

async function fetchReplies(postId) {
  const response = await fetch(`/posts/${postId}/replies`);
  const replies = await response.json();

  const repliesList = document.getElementById(`repliesList-${postId}`);
  repliesList.innerHTML = '';

  replies.forEach((reply) => {
    const replyItem = document.createElement('li');
    replyItem.className = 'list-group-item';
    replyItem.textContent = `${reply.userId.username}: ${reply.content}`;
    repliesList.appendChild(replyItem);
  });
}

document.getElementById('createPostButton').addEventListener('click', createPost);

// Initially load posts
fetchPosts();