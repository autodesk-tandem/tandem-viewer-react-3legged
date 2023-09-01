# Tandem Viewer Sample for React (3-legged)

## Overview
This sample provides example of using Tandem Viewer in React application. It covers following concepts:
- Using 3-legged authentication
- How to wrap Tandem Viewer by React component
- How to get list of facilities for user
- How to display default view of facility

## Prerequisites
- Node.js
- Vite
- VS Code (another IDE can be used as well)

## Development mode
This is assuming you're using VS Code as your development editor. It's possible to use another environment but steps below may differ.

Follow these steps to run application locally:
1. Run `git clone` to clone repository. The repo has two sub folders:
   * `server`
   * `client` 
2. Start VS Code and open `server` folder.
3. Run `npm install`.
4. Update `.env` file with your details.
5. Run server under debugger (Run - Start Debugging or F5).
6. Open new VS Code window (File - New Window).
7. Open `client` folder.
8. Run `npm install`.
9. Open terminal and run `npm run dev`.
10. Open your browser and navigate to http://localhost:3000

## How it works
### Server
The server is simple Node.js server which exposes following end points:
- `/api/auth/url` - provides authorization URL.
- `/api/auth/callback` - it's called by APS Authentication service when user is authenticated.
- `/api/auth/token` - provides valid to to client. Then token is used by viewer to display facility.
- `/api/userprofile` - provides information about user for active session.

### Client
1. When the application is loaded it check if there is user information available for current session.
2. User can click Login button to start authentication flow.
3. Application redirects to authorization URL provided by back end.
4. User can now authenticate using Autodesk ID.
5. After succesfull authentication user is redirect back to application.
6. The application check user profile again. Now it's valid so `Viewer` component is created. This trigger `onAppInitialized` callback. From within the callback the drop down is populated by available facilities.
7. When user selects facility it's passed to `Viewer` component. The facility is loaded and default view is set as active.