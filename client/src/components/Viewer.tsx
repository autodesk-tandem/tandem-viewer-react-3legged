import { useEffect, useRef} from 'react';
import './Viewer.css';

type ViewerProps = {
  facility?: Autodesk.Tandem.DtFacility;
  onAppInitialized?: (app: Autodesk.Tandem.DtApp) => void;
  onFacetsLoaded?: (event: any) => void;
  onFacilityLoaded?: (facility: Autodesk.Tandem.DtFacility) => void;
  onViewerInitialized?: (viewer: Autodesk.Viewing.GuiViewer3D) => void;
  onViewerUninitialized?: (viewer: Autodesk.Viewing.GuiViewer3D) => void;
};

const Viewer = (props: ViewerProps) => {
  const {
    facility
  } = props;
  const viewerDOMRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const appRef = useRef<any>(null);

  const handleAppInitialized = (app: Autodesk.Tandem.DtApp) => {
    if (props.onAppInitialized) {
      props.onAppInitialized(app);
    }
  };

  const handleFacetsLoaded = (model: Autodesk.Tandem.DtModel) => {
    if (props.onFacetsLoaded) {
      props.onFacetsLoaded(model);
    }
  };

  const handleFacilityLoaded = (facility: Autodesk.Tandem.DtFacility) => {
    if (props.onFacilityLoaded) {
      props.onFacilityLoaded(facility);
    }
  };

  const handleViewerInitialized = (event: any) => {
    if (props.onViewerInitialized) {
      props.onViewerInitialized(event.target);
    }
  };

  const handleViewerUninitialized = (event: any) => {
    if (props.onViewerUninitialized) {
      props.onViewerUninitialized(event.target);
    }
  };

  useEffect(() => {
    if (!viewerRef.current && viewerDOMRef.current) {
      const viewer = new Autodesk.Viewing.GuiViewer3D(viewerDOMRef.current, {
        extensions: [ 'Autodesk.BoxSelection' ],
        screenModeDelegate: Autodesk.Viewing.NullScreenModeDelegate,
        theme: 'light-theme'
      });

      viewerRef.current = viewer;
      viewer.addEventListener(Autodesk.Viewing.VIEWER_INITIALIZED, handleViewerInitialized);
      viewer.addEventListener(Autodesk.Viewing.VIEWER_UNINITIALIZED, handleViewerUninitialized);
      viewer.addEventListener('toolbarCreated', (event) => {
        console.log(`toolbarCreated`);
        event.target.toolbar.addClass('adsk-toolbar-vertical');
        event.target.toolbar.container.style['justify-content'] = 'unset';
        event.target.toolbar.container.style['top'] = '175px';
      });
      viewer.start();
      // create Tandem application
      const app = new Autodesk.Tandem.DtApp();
      
      appRef.current = app;
      app.addEventListener(Autodesk.Tandem.DT_FACETS_LOADED, (e) => {
        handleFacetsLoaded(e.model);
      });
      
      handleAppInitialized(app);
    }
  }, []);

  // called when facility is updated
  useEffect(() => {
    async function loadFacility(app: Autodesk.Tandem.DtApp, viewer: Autodesk.Viewing.GuiViewer3D, facility: Autodesk.Tandem.DtFacility) {
      const views = await app.views.fetchFacilityViews(facility);
      const view = views.find((v: any) => {
        return v.default;
      });

      let models = undefined;
      
      if (view) {
        models = new Set<string>(view?.facets?.filters?.models);
      }
      
      const res = await app.displayFacility(facility, models, viewer);
      
      if (view) {
        await app.views.setCurrentView(facility, view);
      }
      handleFacilityLoaded(res);
    }

    if (!facility) {
      return;
    }
    if (appRef.current && viewerRef.current) {
      loadFacility(appRef.current, viewerRef.current, facility);
    }
  }, [ facility ] );

  return (
    <div className="viewer" ref={viewerDOMRef}></div>
  );
};

export default Viewer;