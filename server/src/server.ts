import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const app = express();

app.use(session({
  secret: '1111111111',
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // lifetime 14 days
  },
  name: 'tandem.react.sample',
  resave: false,
  saveUnitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb'}));
app.use(bodyParser.json({ limit: '1mb'}));
app.use(cookieParser());

// API endpoints
app.get('/api/auth/url', (req, res) => {
  const url = getAuthorizationURL(process.env.APS_KEY, process.env.APS_CALLBACK_URL,
    [ 'data:read', 'user-profile:read', 'viewables:read']);

  res.status(200).json({
    url: url
  });
});

app.get('/api/auth/callback', async (req, res) => {
  console.log(`callback`);
  const token = await getToken(process.env.APS_KEY,
    process.env.APS_SECRET,
    process.env.APS_CALLBACK_URL,
    req.query.code);

  console.debug(`${token.access_token}`);
  const now = new Date();

  req.session.expires_at = now.setSeconds(now.getSeconds() + token.expires_in);
  req.session.access_token = token.access_token;
  req.session.refresh_token = token.refresh_token;
  res.redirect(`http://localhost:3000`);
});

app.post('/api/auth/token', (req, res) => {
  const timeDiff = Math.trunc((req.session.expires_at - Date.now()) / 1000);

  res.status(200).json({
    access_token: req.session.access_token,
    expires_in: timeDiff
  });
});

app.get('/api/userprofile', async (req, res) => {
  if (!req.session?.access_token) {
    return res.status(401).end();
  }
  const userProfile = await getUserProfile(req.session.access_token);

  res.status(200).json(userProfile);
});

function getAuthorizationURL(clientID: string, callbackURL: string, scope: string[]) {
  const options = new URLSearchParams({
    'client_id': clientID,
    'response_type': 'code',
    'redirect_uri': callbackURL,
    'scope': scope.join(' ')
  });
  const url = `https://developer.api.autodesk.com/authentication/v2/authorize?${options}`;

  return url;
}

async function getToken(clientID: string, clientSecret: string, callbackURL: string, code: string) {
  const auth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
  const options = new URLSearchParams({
    'grant_type': 'authorization_code',
    'code': code,
    'redirect_uri': callbackURL
  });
  const response = await fetch(`https://developer.api.autodesk.com/authentication/v2/token`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${auth}`
      },
      body: options
    });
  const result = await response.json();

  return result;
}

async function getUserProfile(token: string) {
  const response = await fetch(`https://api.userprofile.autodesk.com/userinfo`, {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
  const data = await response.json();

  return data;
}

// start server
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
