require('dotenv').config();
const mongoose = require('mongoose');
const express = require('express');
const session = require('express-session');
const bcrypt = require('bcryptjs');
 
const app = express();
const port = 3000;

const mongoURI = process.env.MONGO_URI;

mongoose.connect(mongoURI)
  .then(() => console.log('Connected to MongoDB'))
  .catch((err) => {
    console.error('Connection error:', err);
    process.exit(1);
  });

const messageSchema = new mongoose.Schema({
  content: String,
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Message = mongoose.model('Message', messageSchema);

app.use(express.json());
app.use(express.static('public'));

app.use(session({
  secret: 'yourSecretKey', // Replace with a secure key in a real app
  resave: false,
  saveUninitialized: false
}));

const userSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  password: String
});

const User = mongoose.model('User', userSchema);

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

app.get('/messages', async (req, res) => {
  try {
    const messages = await Message.find().sort({ timestamp: -1 }).populate('userId', 'username');
    res.json(messages);
  } catch (err) {
    res.status(500).send('Error retrieving messages');
  }
});

app.post('/messages', async (req, res) => {
  const messageContent = req.body.message;
  const userId = req.session.userId;

  if (!messageContent) {
    return res.status(400).send('Message content is required');
  }

  const message = new Message({ content: messageContent, userId });

  try {
    await message.save();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send('Error saving message');
  }
});

function isAuthenticated(req, res, next) {
  if (req.session.userId) {
    return next();
  } else {
    res.json({ success: false, message: 'You need to log in' });
  }
}

// Handling user registration
app.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      return res.json({ success: false, message: 'Username already exists' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    const savedUser = await user.save();

    req.session.userId = savedUser._id; // Log the user in
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Error registering user');
  }
});

// Handling user login
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).send('Username and password are required');
  }

  try {
    const user = await User.findOne({ username });
    if (!user) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.json({ success: false, message: 'Invalid credentials' });
    }
    req.session.userId = user._id;
    res.json({ success: true });
  } catch (err) {
    res.status(500).send('Error logging in');
  }
});

app.post('/logout', (req, res) => {
  req.session.destroy();
  res.json({ success: true });
});

const postSchema = new mongoose.Schema({
  title: String,
  content: String,
  topic: String, // Add topic field
  timestamp: { type: Date, default: Date.now },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
});

const Post = mongoose.model('Post', postSchema);

// Fetch all posts
app.get('/posts/topic/:topic', async (req, res) => {
  const { topic } = req.params;
  try {
    const posts = await Post.find({ topic }).sort({ timestamp: -1 }).populate('userId', 'username');
    res.json(posts);
  } catch (err) {
    res.status(500).send('Error retrieving posts by topic');
  }
});

// Create a new post
app.post('/posts', async (req, res) => {
  const { title, content, topic } = req.body;
  const userId = req.session.userId;

  if (!title || !content || !topic) {
    return res.status(400).send('Title, content, and topic are required');
  }

  const post = new Post({ title, content, topic, userId });

  try {
    await post.save();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send('Error saving post');
  }
});

const replySchema = new mongoose.Schema({
  content: String,
  timestamp: { type: Date, default: Date.now },
  postId: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Reply', default: null } // Reference to parent reply
});

const Reply = mongoose.model('Reply', replySchema);

// Add a reply to a post
app.post('/posts/:postId/replies', async (req, res) => {
  const { content } = req.body;
  const userId = req.session.userId;
  const { postId } = req.params;

  if (!content) {
    return res.status(400).send('Reply content is required');
  }

  const reply = new Reply({ content, postId, userId });

  try {
    await reply.save();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send('Error saving reply');
  }
});

// Fetch replies for a specific post
app.get('/posts/:postId/replies', async (req, res) => {
  const { postId } = req.params;

  try {
    const replies = await Reply.find({ postId }).populate('userId', 'username').sort({ timestamp: -1 });
    res.json(replies);
  } catch (err) {
    res.status(500).send('Error retrieving replies');
  }
});

app.post('/posts/:postId/replies', async (req, res) => {
  const { content, parentId } = req.body; // parentId can be null or the ID of another reply
  const userId = req.session.userId;
  const { postId } = req.params;

  if (!content) {
    return res.status(400).send('Reply content is required');
  }

  const reply = new Reply({ content, postId, userId, parentId });

  try {
    await reply.save();
    res.send({ success: true });
  } catch (err) {
    res.status(500).send('Error saving reply');
  }
});

app.get('/posts/:postId/replies', async (req, res) => {
  const { postId } = req.params;

  try {
    // Fetch all replies linked to this post
    const replies = await Reply.find({ postId })
      .lean() // lean() provides plain JS objects instead of Mongoose Document instances, which helps in manipulating data.
      .populate('userId', 'username')
      .exec();

    // Create a map to streamline parent-child relationships
    const replyMap = {};
    replies.forEach((reply) => {
      replyMap[reply._id] = { ...reply, children: [] };
    });

    // Nest child replies under their parent
    const nestedReplies = [];
    replies.forEach((reply) => {
      if (reply.parentId) {
        replyMap[reply.parentId].children.push(replyMap[reply._id]);
      } else {
        nestedReplies.push(replyMap[reply._id]);
      }
    });

    res.json(nestedReplies);
  } catch (err) {
    res.status(500).send('Error retrieving replies');
  }
});