import React, { useEffect, useRef, useState } from 'react'
import { getUserProfile, initializeViewer } from './utils/viewerUtils';
import TeamList from './components/TeamList';
import FacilityList from './components/FacilityList';
import Viewer from './components/Viewer';
import './App.css'

function App() {
  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean>(false);
  const [ isViewerInitialized, setIsViewerInitialized ] = useState<boolean>(false);
  const [ teamList, setTeamList ] = useState<Autodesk.Tandem.DtTeam[]>([]);
  const [ facilityList, setFacilityList ] = useState<Autodesk.Tandem.DtFacility[]>([]);
  const [ selectedFacilityId, setSelectedFacilityId ] = useState<string>();
  const [ selectedTeam, setSelectedTeam ] = useState<any>(null);
  const [ selectedFacility, setSelectedFacility ] = useState<any>(null);

  const appRef = useRef<Autodesk.Tandem.DtApp | null>(null);

  const onLogin = async () => {
    const response = await fetch('/api/auth/url');
    const data = await response.json();
    
    console.log(data);
    window.location.replace(data?.url);
  };

  const onLogout = () => {
    window.location.replace(`https://developer.api.autodesk.com/authentication/v2/logout?post_logout_redirect_uri=http://localhost:3000?logout`);
  };

  const onTeamChange = async (team: Autodesk.Tandem.DtTeam) => {
    if (!team.facilities) {
      await team.getFacilities();
    }
    setSelectedTeam(team);
  };

  // remember id of selected facility when user changes selection
  const onFacilityChange = (facility: Autodesk.Tandem.DtFacility) => {
    setSelectedFacilityId(facility.twinId);
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
  // when app is initialized get list of teams 
  const onAppInitialized = async (app: Autodesk.Tandem.DtApp) => {
    console.log(`app initialized`);
    appRef.current = app;
    const teams = await app.getTeams();
    const sortedTeams = teams.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    const sharedFacilities = await app.getUsersFacilities();

    if (sharedFacilities?.length > 0) {
      const dummyTeam = {
        id: 'shared',
        name: '** Shared directly **',
        owner: '',
        facilities: sharedFacilities
      };

      // @ts-ignore
      sortedTeams.unshift(dummyTeam);
    }

    setTeamList(sortedTeams);
  };

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

  // called when team selection changes
  useEffect(() => {
    if (!selectedTeam) {
      return;
    }
    setFacilityList(selectedTeam.facilities);
  }, [ selectedTeam ]);

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
          <TeamList
            teams={teamList}
            onTeamChange={onTeamChange} />
          <FacilityList
            facilities={facilityList}
            onFacilityChange={onFacilityChange} />
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
