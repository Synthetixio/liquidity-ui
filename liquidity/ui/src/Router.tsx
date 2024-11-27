import { Spinner } from '@chakra-ui/react';
import { Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { DefaultLayout } from './layouts/Default/DefaultLayout';
import { NotFoundPage } from './pages/404';
import { Settings } from './pages/Account/Settings';
import { Dashboard } from './pages/Dashboard';
import { Home } from './pages/Home';
import { Manage } from './pages/Manage';
import { Pool } from './pages/Pool';
import { Pools } from './pages/Pools';

export const Router = () => {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route element={<DefaultLayout />}>
          <Route path="/account/settings" element={<Settings />} />
          <Route path="/positions/:collateralSymbol/:poolId" element={<Manage />} />
          <Route path="/pools" element={<Pools />} />
          <Route path="/pools/:networkId/:poolId" element={<Pool />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/" element={<Home />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </Suspense>
  );
};
