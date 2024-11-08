// Event listeners
document.getElementById('createPostButton').addEventListener('click', createPost);
document.getElementById('postButton').addEventListener('click', postMessage);
document.getElementById('logoutButton').addEventListener('click', logout);

async function register() {
  const username = document.getElementById('regUsername').value;
  const password = document.getElementById('regPassword').value;

  try {
    const response = await fetch('/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success) {
      alert('Registration successful! Automatically logged in.');
      updateAuthUI(true);
    } else {
      alert(result.message || 'Registration failed');
    }
  } catch (err) {
    console.error('Error during registration:', err);
    alert('An error occurred during registration.');
  }
}

async function login() {
  const username = document.getElementById('loginUsername').value;
  const password = document.getElementById('loginPassword').value;

  try {
    const response = await fetch('/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password }),
    });
    const result = await response.json();
    if (result.success) {
      updateAuthUI(true);
      alert('Login successful!');
      getMessages();
    } else {
      alert(result.message || 'Login failed');
    }
  } catch (err) {
    console.error('Error during login:', err);
    alert('An error occurred during login.');
  }
}

async function logout() {
  try {
    const response = await fetch('/logout', { method: 'POST' });
    const result = await response.json();
    if (result.success) {
      updateAuthUI(false);
      alert('Logged out!');
    } else {
      alert('Logout failed');
    }
  } catch (err) {
    console.error('Error during logout:', err);
    alert('An error occurred during logout.');
  }
}

function updateAuthUI(isLoggedIn) {
  document.getElementById('auth').style.display = isLoggedIn ? 'none' : 'block';
  document.getElementById('logoutButton').style.display = isLoggedIn ? 'block' : 'none';
}

async function postMessage() {
  const message = document.getElementById('messageInput').value.trim();
  if (!message) {
    alert('Please enter a message before posting!');
    return;
  }

  try {
    const response = await fetch('/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message }),
    });

    if (response.ok) {
      document.getElementById('messageInput').value = '';
      getMessages();
    } else {
      alert('Failed to post message.');
    }
  } catch (err) {
    console.error('Error posting message:', err);
    alert('An error occurred while posting the message.');
  }
}

async function getMessages() {
  try {
    const response = await fetch('/messages');
    if (response.ok) {
      const messages = await response.json();
      displayMessages(messages);
    } else {
      throw new Error('Failed to retrieve messages');
    }
  } catch (err) {
    console.error('Network error while fetching messages:', err);
    alert('An error occurred while retrieving messages.');
  }
}

function displayMessages(messages) {
  const messagesList = document.getElementById('messagesList');
  messagesList.innerHTML = '';

  messages.forEach((message) => {
    const li = document.createElement('li');
    li.textContent = `${message.userId.username}: ${message.content}`;
    messagesList.appendChild(li);
  });
}

async function createPost() {
  const title = document.getElementById('postTitle').value.trim();
  const content = document.getElementById('postContent').value.trim();
  const topic = document.getElementById('postTopic').value;

  if (!title || !content || !topic) {
    alert('Please fill out title, content, and select a topic to submit a post.');
    return;
  }

  console.log('Creating post:', { title, content, topic });

  try {
    const response = await fetch('/posts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, content, topic }),
    });

    if (response.ok) {
      resetPostForm();
      fetchPosts();
    } else {
      alert('Failed to create post.');
    }
  } catch (error) {
    console.error('Error creating post:', error);
    alert('An error occurred while creating the post.');
  }
}

function resetPostForm() {
  document.getElementById('postTitle').value = '';
  document.getElementById('postContent').value = '';
  document.getElementById('postTopic').value = '';
}

async function fetchPosts(topic = '') {
  const url = topic ? `/posts/topic/${topic}` : '/posts';
  try {
    const response = await fetch(url);
    if (response.ok) {
      const posts = await response.json();
      displayPosts(posts);
    } else {
      throw new Error('Failed to fetch posts');
    }
  } catch (error) {
    console.error('Error fetching posts:', error);
    alert('An error occurred while retrieving posts.');
  }
}

function displayPosts(posts) {
  const postsList = document.getElementById('postsList');
  postsList.innerHTML = '';

  posts.forEach((post) => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    const shareLink = generateShareableLink(post._id);
    li.innerHTML = `
      <h5>${post.userId.username}: ${post.title} (${post.topic})</h5>
      <p>${post.content}</p>
      <button class="btn btn-sm btn-secondary" onclick="copyToClipboard('${shareLink}')">Copy Link</button>
      <div>
        <textarea class="form-control mb-2" placeholder="Write a reply" id="replyContent-${post._id}"></textarea>
        <button class="btn btn-primary btn-sm" onclick="addReply('${post._id}')">Reply</button>
      </div>
      <ul id="repliesList-${post._id}" class="list-group mt-2"></ul>
    `;
    postsList.appendChild(li);
    fetchReplies(post._id);
  });
}

async function addReply(postId) {
  const replyContent = document.getElementById(`replyContent-${postId}`).value.trim();
  if (!replyContent) {
    alert('A reply cannot be empty');
    return;
  }

  try {
    const response = await fetch(`/posts/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent }),
    });

    if (response.ok) {
      fetchReplies(postId);
      document.getElementById(`replyContent-${postId}`).value = '';
    } else {
      alert('Failed to add reply.');
    }
  } catch (error) {
    console.error('Error adding reply:', error);
    alert('An error occurred while adding the reply.');
  }
}

async function fetchReplies(postId) {
  try {
    const response = await fetch(`/posts/${postId}/replies`);
    if (response.ok) {
      const replies = await response.json();
      const repliesList = document.getElementById(`repliesList-${postId}`);
      repliesList.innerHTML = createRepliesHTML(replies);
    } else {
      throw new Error('Failed to fetch replies');
    }
  } catch (error) {
    console.error('Error fetching replies:', error);
    alert('An error occurred while retrieving replies.');
  }
}

function createRepliesHTML(replies) {
  return replies.map(reply => `
    <li class="list-group-item">
      <div><strong>${reply.userId.username}</strong>: ${reply.content}</div>
      <button class="btn btn-link btn-sm" onclick="showReplyForm('${reply._id}')">Reply</button>
      <div id="replyForm-${reply._id}" style="display:none;" class="mb-2">
        <textarea class="form-control mb-2" placeholder="Write a nested reply" id="nestedReplyContent-${reply._id}"></textarea>
        <button class="btn btn-primary btn-sm" onclick="addNestedReply('${reply.postId}', '${reply._id}')">Submit Reply</button>
      </div>
      <ul>${createRepliesHTML(reply.children)}</ul>
    </li>
  `).join('');
}

function showReplyForm(replyId) {
  document.getElementById(`replyForm-${replyId}`).style.display = 'block';
}

async function addNestedReply(postId, parentId) {
  const replyContent = document.getElementById(`nestedReplyContent-${parentId}`).value.trim();
  if (!replyContent) {
    alert('A reply cannot be empty');
    return;
  }

  try {
    const response = await fetch(`/posts/${postId}/replies`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: replyContent, parentId }),
    });

    if (response.ok) {
      fetchReplies(postId);
    } else {
      alert('Failed to add reply.');
    }
  } catch (error) {
    console.error('Error adding nested reply:', error);
    alert('An error occurred while adding the nested reply.');
  }
}

function generateShareableLink(postId) {
  return `${window.location.origin}/post/${postId}`;
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Link copied to clipboard');
  }).catch(err => {
    alert('Failed to copy link', err);
  });
}

// Load initial messages and posts
getMessages();
fetchPosts();

document.getElementById('searchButton').addEventListener('click', searchPosts);

async function searchPosts() {
  const searchQuery = document.getElementById('searchInput').value.trim();

  if (!searchQuery) {
    alert('Please enter a search query.');
    return;
  }

  try {
    const response = await fetch(`/search?query=${encodeURIComponent(searchQuery)}`);
    if (response.ok) {
      const posts = await response.json();
      displaySearchResults(posts);
    } else {
      alert('Failed to search posts.');
    }
  } catch (error) {
    console.error('Error searching posts:', error);
    alert('An error occurred while searching for posts.');
  }
}

function displaySearchResults(posts) {
  const searchResultsList = document.getElementById('searchResultsList');
  searchResultsList.innerHTML = '';

  if (posts.length === 0) {
    searchResultsList.innerHTML = '<li>No results found</li>';
    return;
  }

  posts.forEach(post => {
    const li = document.createElement('li');
    li.className = 'list-group-item';
    li.innerHTML = `
      <h5>${post.userId.username}: ${post.title} (${post.topic})</h5>
      <p>${post.content}</p>
    `;
    searchResultsList.appendChild(li);
  });
}