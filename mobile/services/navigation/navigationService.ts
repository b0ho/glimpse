import { NavigationContainerRef } from '@react-navigation/native';
import { RootNavigationParamList } from '@/navigation/AppNavigator';

let navigationRef: NavigationContainerRef<RootNavigationParamList> | null = null;

export const navigationService = {
  setNavigationRef(ref: NavigationContainerRef<RootNavigationParamList>) {
    navigationRef = ref;
  },

  navigate<RouteName extends keyof RootNavigationParamList>(
    name: RouteName,
    params?: RootNavigationParamList[RouteName]
  ) {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.navigate(name as any, params as any);
    }
  },

  goBack() {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.goBack();
    }
  },

  reset(routes: any[]) {
    if (navigationRef && navigationRef.isReady()) {
      navigationRef.reset({
        index: 0,
        routes,
      });
    }
  },

  getCurrentRoute() {
    if (navigationRef && navigationRef.isReady()) {
      return navigationRef.getCurrentRoute();
    }
    return null;
  },

  isReady() {
    return navigationRef && navigationRef.isReady();
  }
};