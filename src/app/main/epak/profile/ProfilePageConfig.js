import { lazy } from 'react';

const ProfilePage = lazy(() => import('./ProfilePage'));

const ProfilePageConfig = {
  settings: {
    layout: {
      config: {},
    },
  },
  routes: [
    {
      path: 'identitas',
      element: <ProfilePage />,
    },
  ],
};

export default ProfilePageConfig;
