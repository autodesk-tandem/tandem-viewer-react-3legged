declare namespace Autodesk {
  namespace Viewing {
    namespace Private {

      interface CompactView {
        id: string;
        viewName: string;
        dashboardName: string;
        label: string;
        default: boolean;
      }

      interface View extends CompactView {
        camera?: any;
        camera?: cutPlanes;
        dashboard?: any;
        createTime?: string;
      }
      
      class DtApp {
        constructor(options?: any);

        view: DtViews;

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

      class DtViews {
        fetchFacilityViews(facility: DtFacility): Promise<CompactView[]>;
        setCurrentView(facility: DtFacility, view: View): Promise<void>;
      }

    }
  }
}