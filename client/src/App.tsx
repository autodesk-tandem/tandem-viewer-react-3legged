import React, { useCallback, useEffect, useRef, useState } from 'react'
import { getUserProfile, initializeViewer } from './utils/viewerUtils';
import TeamList from './components/TeamList';
import FacilityList from './components/FacilityList';
import ViewList from './components/ViewList';
import Viewer from './components/Viewer';
import './App.css'


const App = () => {
  const [ isLoggedIn, setIsLoggedIn ] = useState<boolean>(false);
  const [ isViewerInitialized, setIsViewerInitialized ] = useState<boolean>(false);
  const [ teamList, setTeamList ] = useState<Autodesk.Tandem.DtTeam[]>([]);
  const [ facilityList, setFacilityList ] = useState<Autodesk.Tandem.DtFacility[]>([]);
  const [ selectedFacilityId, setSelectedFacilityId ] = useState<string>();
  const [ selectedViewId, setSelectedViewId ] = useState<string>();
  const [ selectedTeam, setSelectedTeam ] = useState<any>(null);

  const [ selectedFacility, setSelectedFacility ] = useState<any>(null);
  const [ selectedView, setSelectedView ] = useState<any>(null);
  const [ viewList, setViewList ] = useState<any[]>([]);

  const appRef = useRef<Autodesk.Tandem.DtApp | null>(null);

  const onLogin = useCallback(async () => {
    const response = await fetch('/api/auth/url');
    const data = await response.json();
    
    console.log(data);
    window.location.replace(data?.url);
  }, []);

  const onLogout = useCallback(() => {
    window.location.replace(`https://developer.api.autodesk.com/authentication/v2/logout?post_logout_redirect_uri=http://localhost:3000?logout`);
  }, []);

  const onTeamChange = useCallback(async (team: Autodesk.Tandem.DtTeam) => {
    if (!team.facilities) {
      await team.getFacilities();
    }
    setSelectedTeam(team);
  }, [ teamList ]);

  // remember id of selected facility when user changes selection
  const onFacilityChange = (facility: Autodesk.Tandem.DtFacility) => {
    setSelectedFacilityId(facility.twinId);
  };

  // remember id of selected view when user changes selection
  const onViewChange = (view: Autodesk.Tandem.CompactView) => {
    setSelectedViewId(view.id);
  };

  // set selected facility based on selected id
  const onLoad = () => {
    const facility = facilityList?.find(f => {
      return f.twinId === selectedFacilityId;
    });

    if (!facility) {
      return;
    }
    const view = viewList?.find(v => {
      return v.id === selectedViewId;
    });

    setSelectedFacility(facility);
    setSelectedView(view);
  };

  // when app is initialized get list of teams
  const onAppInitialized = async (app: Autodesk.Tandem.DtApp) => {
    console.log(`app initialized`);
    appRef.current = app;
    const teams = await app.getTeams();
    const sortedTeams = teams.sort((a, b) => {
      return a.name.localeCompare(b.name);
    });

    const sharedFacilities = await app.getSharedFacilities();

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

  const onViewerInitialized = () => {
    console.log(`viewer initialized`);
  };

  const onFacilityLoaded = async (facility: Autodesk.Tandem.DtFacility) => {
    console.log(`facility loaded: ${facility.twinId}`);
  };

  const onViewChanged = async (view: Autodesk.Tandem.CompactView) => {
    console.log(`view changed: ${view.id}`);
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

  // called when facility selection changes
  useEffect(() => {
    const facility = facilityList?.find(f => {
      return f.twinId === selectedFacilityId;
    });

    if (!facility) {
      return;
    }
    facility.app.views.fetchFacilityViews(facility).then((views) => {
      const sortedViews: any[] = views.sort((a, b) => {
        if (a.default) {
          return -1;
        }
        return a.viewName.localeCompare(b.viewName);
      });
      setViewList(sortedViews);
    });
  }, [ selectedFacilityId ]);

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
          <ViewList
            views={viewList}
            onViewChange={onViewChange} />
          <button onClick={onLoad}>Load</button>
        </div>
        <div className="right">
          {isViewerInitialized &&
            <div className="viewer-container">
              <Viewer
                onAppInitialized={onAppInitialized}
                onCurrentViewChanged={onViewChanged}
                onFacilityLoaded={onFacilityLoaded}
                onViewerInitialized={onViewerInitialized}
                facility={selectedFacility}
                view={selectedView} />
            </div>
          }
        </div>
      </div>
    </React.Fragment>
  );
};

export default App;
