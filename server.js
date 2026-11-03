const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fileUpload = require('express-fileupload');
const jwt = require('jsonwebtoken');
const _ = require('lodash');
const request = require('request');
const xml2js = require('xml2js');
const serialize = require('serialize-javascript');
const ejs = require('ejs');
const dotenv = require('dotenv');
const multer = require('multer');
const morgan = require('morgan');
const validator = require('validator');

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(fileUpload());
app.use(morgan('combined'));
app.set('view engine', 'ejs');

// Vulnerable endpoint using lodash (CVE-2019-10744, CVE-2020-8203)
app.post('/api/merge', (req, res) => {
  const defaults = { isAdmin: false };
  const merged = _.merge({}, defaults, req.body);
  res.json(merged);
});

// Vulnerable endpoint using jwt (CVE-2022-23529)
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username && password) {
    const token = jwt.sign({ username, role: 'user' }, 'secret-key');
    res.json({ token });
  } else {
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// Vulnerable endpoint using xml2js (CVE-2023-0842)
app.post('/api/parse-xml', (req, res) => {
  const parser = new xml2js.Parser();
  parser.parseString(req.body.xml, (err, result) => {
    if (err) {
      res.status(400).json({ error: 'Invalid XML' });
    } else {
      res.json(result);
    }
  });
});

// Vulnerable endpoint using request for SSRF
app.post('/api/fetch', (req, res) => {
  const url = req.body.url;
  request(url, (error, response, body) => {
    if (error) {
      res.status(500).json({ error: error.message });
    } else {
      res.json({ data: body });
    }
  });
});

// Vulnerable endpoint using ejs template (CVE-2022-29078)
app.post('/api/render', (req, res) => {
  const template = req.body.template;
  const rendered = ejs.render(template, req.body.data || {});
  res.send(rendered);
});

// Vulnerable serialization endpoint (CVE-2020-7660)
app.post('/api/serialize', (req, res) => {
  const serialized = serialize(req.body);
  res.json({ serialized });
});

// File upload endpoint using multer
const upload = multer({ dest: 'uploads/' });
app.post('/api/upload', upload.single('file'), (req, res) => {
  res.json({ filename: req.file.filename });
});

// Validator endpoint
app.post('/api/validate', (req, res) => {
  const { email } = req.body;
  const isValid = validator.isEmail(email);
  res.json({ valid: isValid });
});

app.get('/', (req, res) => {
  res.send('Vulnerable Express App - For Testing Purposes Only');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

module.exports = app;
