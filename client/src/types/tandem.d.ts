declare namespace Autodesk {
  namespace Tandem {
    class DtViewerState {
      static setView(facility: DtFacility, view: any, currentView?: any): Promise<void>;
    }
  }
  
  namespace Viewing {
    namespace Private {
      
      class DtApp {
        constructor(options?: any);

        displayFacility(facility: DtFacility, visibleModelsForView: Set<string> | undefined, viewer: Autodesk.Viewing.GuiViewer3D, forceReload?: boolean): Promise<DtFacility>;
        getUsersFacilities(): Promise<DtFacility[]>;
      }

      class DtFacility {
        settings: {
          props: { [key: string]: { [key: string]: string; }};
        };
        twinId: string;

        getSavedViewsList(): Promise<any[]>;

      }

    }
  }
}