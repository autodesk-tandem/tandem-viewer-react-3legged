import express from 'express';
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import session from 'express-session';

const { SESSION_SECRET, APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL } = process.env as {
  SESSION_SECRET: string;
  APS_CLIENT_ID: string;
  APS_CLIENT_SECRET: string;
  APS_CALLBACK_URL: string;
};

if (!APS_CLIENT_ID || !APS_CLIENT_SECRET || !APS_CALLBACK_URL || !SESSION_SECRET) {
    console.warn('Missing some of the following env. variables:');
    console.warn('APS_CLIENT_ID, APS_CLIENT_SECRET, APS_CALLBACK_URL, SESSION_SECRET');
}
const app = express();

app.use(session({
  secret: SESSION_SECRET,
  cookie: {
    path: '/',
    httpOnly: true,
    maxAge: 14 * 24 * 60 * 60 * 1000 // lifetime 14 days
  },
  name: 'tandem.react.sample',
  resave: false,
  saveUninitialized: false
}));
app.use(bodyParser.urlencoded({ extended: true, limit: '1mb'}));
app.use(bodyParser.json({ limit: '1mb'}));
app.use(cookieParser());

// API endpoints
app.get('/api/auth/url', (req, res) => {
  const url = getAuthorizationURL(APS_CLIENT_ID, APS_CALLBACK_URL,
    [ 'data:read', 'viewables:read', 'user-profile:read', 'profapi:img-profile-read']);

  res.status(200).json({
    url: url
  });
});

app.get('/api/auth/callback', async (req, res) => {
  console.log(`callback`);
  const token = await getToken(APS_CLIENT_ID,
    APS_CLIENT_SECRET,
    APS_CALLBACK_URL,
    req.query.code as string);

  // save token data into session
  saveSessionData(req, token);
  res.redirect(`http://localhost:3000`);
});

app.post('/api/auth/token', async (req, res) => {
  const timeDiff = Math.trunc((req.session.expires_at - Date.now()) / 1000);

  if (timeDiff < 10) {
    const token = await refreshToken(APS_CLIENT_ID,
      APS_CLIENT_SECRET,
      req.session.refresh_token);

    saveSessionData(req, token);
  }
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

  console.debug(`get token: ${response.status}`);
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

async function refreshToken(clientID: string, clientSecret: string, refreshToken: string) {
  const auth = Buffer.from(`${clientID}:${clientSecret}`).toString('base64');
  const options = new URLSearchParams({
    'grant_type': 'refresh_token',
    'refresh_token': refreshToken
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

  console.debug(`refresh token: ${response.status}`);
  const result = await response.json();

  return result;
}

function saveSessionData(req: any, token: any) {
  const now = new Date(Date.now() + + token.expires_in * 1000);

  req.session.expires_at = now.getTime();
  req.session.access_token = token.access_token;
  req.session.refresh_token = token.refresh_token;
}

// start server
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
