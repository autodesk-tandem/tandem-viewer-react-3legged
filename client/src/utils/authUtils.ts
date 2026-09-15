async function createToken() {
  const response = await fetch('/api/auth/token', {
    method: 'POST'
  });
  const data = await response.json();

  return data;
}

export function getToken(callback: (access_token: string, expires_in: number) => void) {
  createToken().then((token) => {
    callback(token.access_token, token.expires_in);
  });
}

export async function getUserProfile(): Promise<any> {
  const response = await fetch('/api/userprofile');
  const data = await response.json();

  return data;
}
