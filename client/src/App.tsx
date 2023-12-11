import React, { useEffect, useState } from 'react'
import { getUserProfile, initializeViewer } from './utils/viewerUtils';
import Viewer from './components/Viewer';
import './App.css'

function App() {
  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean>(false);
  const [ isViewerInitialized, setIsViewerInitialized ] = useState<boolean>(false);
  const [ facilityList, setFacilityList ] = useState<Autodesk.Tandem.DtFacility[]>([]);
  const [ selectedFacilityId, setSelectedFacilityId ] = useState<string>();
  const [ selectedFacility, setSelectedFacility ] = useState<any>(null);

  const onLogin = async () => {
    const response = await fetch('/api/auth/url');
    const data = await response.json();
    
    console.log(data);
    window.location.replace(data?.url);
  };

  const onLogout = () => {
    window.location.replace(`https://developer.api.autodesk.com/authentication/v2/logout?post_logout_redirect_uri=http://localhost:3000?logout`);
  };

  // remember id of selected facility when user changes selection
  const onFacilityChange = (event: any) => {
    setSelectedFacilityId(event.target.value);
  };

  // set selected facility based on selected id
  const onLoad = () => {
    const facility = facilityList?.find(f => {
      return f.twinId === selectedFacilityId;
    });

    if (!facility) {
      return;
    }
    setSelectedFacility(facility);
  };

  // when app is initialized get list of available facilities for current user
  // and remember id of first facility
  const onAppInitialized = async (app: Autodesk.Tandem.DtApp) => {
    console.log(`app initialized`);
    const result = await app.getUsersFacilities();

    setFacilityList(result);
    if (result.length > 0) {
      setSelectedFacilityId(result[0].twinId);
    }
  };

  // called when component is mounted
  useEffect(() => {
    const queryParams = new URLSearchParams(document.location.search);

    // handle case from logout redirect
    if (queryParams.has('logout')) {
      setIsLoggedIn(false);
    } else {
      // otherwise check if there is active user session
      getUserProfile().then((data) => {
        setIsLoggedIn(data && data.name ? true : false);
      }).catch((err) => {
        console.error(err);
        setIsLoggedIn(false);
      });
    }
  }, []);

  // called when logged-in user changed
  useEffect(() => {
    if (!isLoggedIn) {
      return;
    }
    initializeViewer().then(() => {
      setIsViewerInitialized(true);
    });
  }, [ isLoggedIn ]);

  const facilityItems = facilityList?.map((item) => {
    console.log(item);
    let name = item.settings.props['Identity Data']['Project Name'];

    if (name.length === 0) {
      // if project name is empty then use building name
      name = item.settings.props['Identity Data']['Building Name'];
    }
    return (
      <option key={item.twinId} value={item.twinId}>{name}</option>
    );
  });

  return (
    <React.Fragment>
      <div className="header">
        <div className="header-icon"></div>
        <div className="header-title">Tandem React Sample</div>
        <div className="header-login">
          <button onClick={onLogin}>Login</button>
          <button onClick={onLogout}>Logout</button>
        </div>
      </div>
      <div className="main">
        <div className="left">
          <select disabled={!isLoggedIn}
            onChange={onFacilityChange}>{facilityItems}</select>
          <button onClick={onLoad}>Load</button>
        </div>
        <div className="right">
          {isViewerInitialized &&
            <div className="viewer-container">
              <Viewer
                onAppInitialized={onAppInitialized}
                facility={selectedFacility} />
            </div>
          }
        </div>
      </div>
    </React.Fragment>
  );
};

export default App;
