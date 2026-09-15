import { useEffect, useRef } from 'react';
import './Viewer.css';

type ViewerProps = {
  token?: string | null;
  facility?: Autodesk.Tandem.DtFacility;
  view?: Autodesk.Tandem.CompactView;
  onAppInitialized?: (app: Autodesk.Tandem.DtApp) => void;
  onCurrentViewChanged?: (view: Autodesk.Tandem.CompactView) => void;
  onFacilityLoaded?: (facility: Autodesk.Tandem.DtFacility) => void;
  onFacetsLoaded?: (model: Autodesk.Tandem.DtModel) => void;
  onViewerInitialized?: (viewer: Autodesk.Tandem.DtGuiViewer3D) => void;
  onViewerUninitialized?: (viewer: Autodesk.Tandem.DtGuiViewer3D) => void;
};

const Viewer = (props: ViewerProps) => {
  const {
    token,
    facility,
    view,
    onAppInitialized,
    onCurrentViewChanged,
    onFacetsLoaded,
    onFacilityLoaded,
    onViewerInitialized,
    onViewerUninitialized
  } = props;
  const viewerDOMRef = useRef<HTMLDivElement>(null);
  const viewerRef = useRef<any>(null);
  const appRef = useRef<any>(null);

  const handleAppInitialized = (app: Autodesk.Tandem.DtApp) => {
    if (onAppInitialized) {
      onAppInitialized(app);
    }
  };

  const handleCurrentViewChanged = (view: Autodesk.Tandem.CompactView) => {
    if (onCurrentViewChanged) {
      onCurrentViewChanged(view);
    }
  };

  const handleFacetsLoaded = (model: Autodesk.Tandem.DtModel) => {
    if (onFacetsLoaded) {
      onFacetsLoaded(model);
    }
  };

  const handleFacilityLoaded = (facility: Autodesk.Tandem.DtFacility) => {
    if (onFacilityLoaded) {
      onFacilityLoaded(facility);
    }
  };

  const handleViewerInitialized = (event: any) => {
    if (onViewerInitialized) {
      onViewerInitialized(event.target);
    }
  };

  const handleViewerUninitialized = (event: any) => {
    if (onViewerUninitialized) {
      onViewerUninitialized(event.target);
    }
  };

  // called when component is mounted
  useEffect(() => {
    console.log('Viewer mounted');
    if (!viewerRef.current && viewerDOMRef.current) {
      const viewer = new Autodesk.Tandem.DtGuiViewer3D(viewerDOMRef.current, {
        extensions: [
          'Autodesk.Tandem.Measure',
          'Autodesk.Tandem.Section',
          'Autodesk.BimWalk'
        ],
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
      // set header for Tandem API requests
      if (token && Autodesk?.Tandem?.endpoint?.HTTP_REQUEST_HEADERS) {
        Autodesk.Tandem.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${token}`;
      }
      const app = new Autodesk.Tandem.DtApp();

      appRef.current = app;
      window.DT_APP = app;
      if (token && window.DT_APP?.loadContext?.headers) {
        window.DT_APP.loadContext.headers['Authorization'] = `Bearer ${token}`;
      }
      app.addEventListener(Autodesk.Tandem.DT_FACETS_LOADED, (e) => {
        handleFacetsLoaded(e.model);
      });
      app.views.addEventListener(Autodesk.Tandem.DT_CURRENT_VIEW_CHANGED_EVENT, (e) => {
        handleCurrentViewChanged(e.detail.view);
      });
      handleAppInitialized(app);
    }
    if (token && Autodesk?.Tandem?.endpoint?.HTTP_REQUEST_HEADERS) {
      Autodesk.Tandem.endpoint.HTTP_REQUEST_HEADERS['Authorization'] = `Bearer ${token}`;
    }
    if (token && window.DT_APP?.loadContext?.headers) {
      window.DT_APP.loadContext.headers['Authorization'] = `Bearer ${token}`;
    }
  }, [token]);

  useEffect(() => {
    async function loadFacility(app: Autodesk.Tandem.DtApp, viewer: Autodesk.Tandem.DtGuiViewer3D, facility: Autodesk.Tandem.DtFacility, view?: Autodesk.Tandem.CompactView) {
      let targetView = view;
      
      if (!targetView) {
        // view is not provided, try get default view
        const views = await app.views.fetchFacilityViews(facility);

        targetView = views.find((v: Autodesk.Tandem.CompactView) => {
          return v.default;
        });
      }
      await app.displayFacility(facility, targetView, viewer);
      await facility.waitForAllModels();
      if (targetView) {
        await app.views.setCurrentView(facility, targetView);
      }
      handleFacilityLoaded(facility);
    }

    if (!facility) {
      return;
    }
    if (appRef.current && viewerRef.current) {
      loadFacility(appRef.current, viewerRef.current, facility, view);
    }
  }, [ facility, view ]);

  return (
    <div className="viewer" ref={viewerDOMRef} />
  );
};

export default Viewer;