const express = require('express');
const multer = require('multer');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const bodyParser = require('body-parser');

const app = express();
app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const USERS_FILE = path.join(__dirname, 'users.json');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function (req, file, cb) {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Helper functions
function readUsers() {
  if (!fs.existsSync(USERS_FILE)) return [];
  return JSON.parse(fs.readFileSync(USERS_FILE));
}
function writeUsers(users) {
  fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2));
}

// Signup route
app.post('/signup', upload.single('profilePic'), (req, res) => {
  const users = readUsers();
  const { email, alias, psw } = req.body;
  if (users.find(u => u.email === email)) {
    return res.status(400).json({ message: 'Email already registered' });
  }
  const user = {
    email,
    alias,
    password: psw, // WARNING: Plain text for demo only!
    profilePic: req.file ? `/uploads/${req.file.filename}` : null
  };
  users.push(user);
  writeUsers(users);
  res.json({ message: 'Signup successful', user: { email, alias, profilePic: user.profilePic } });
});

// Login route
app.post('/login', (req, res) => {
  const users = readUsers();
  const { email, psw } = req.body;
  const user = users.find(u => u.email === email && u.password === psw);
  if (!user) {
    return res.status(401).json({ message: 'Invalid email or password' });
  }
  res.json({ message: 'Login successful', user: { email: user.email, alias: user.alias, profilePic: user.profilePic } });
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});

const POSTS_FILE = path.join(__dirname, 'posts.json');

// Helper functions for posts
function readPosts() {
  if (!fs.existsSync(POSTS_FILE)) return [];
  return JSON.parse(fs.readFileSync(POSTS_FILE));
}
function writePosts(posts) {
  fs.writeFileSync(POSTS_FILE, JSON.stringify(posts, null, 2));
}

// Save a new post
app.post('/post', express.json(), (req, res) => {
  const { content, author, profilePic } = req.body;
  if (!content || content.length < 20) {
    return res.status(400).json({ message: 'Post must be at least 20 characters.' });
  }
  const posts = readPosts();
  posts.push({
    content,
    author,
    profilePic,
    timestamp: Date.now()
  });
  writePosts(posts);
  res.json({ message: 'Post saved!' });
});

// Get all posts
app.get('/posts', (req, res) => {
  const posts = readPosts();
  res.json(posts);
});