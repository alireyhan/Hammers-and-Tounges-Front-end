import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import profileReducer from './slices/profileSlice';
import adminReducer from './slices/adminSlice';
import managerReducer from './slices/managerSlice';
import sellerReducer from './slices/sellerSlice';
import buyerReducer from './slices/buyerSlice';
import permissionsReducer from './slices/permissionsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    profile: profileReducer,
    admin: adminReducer,
    manager: managerReducer,
    seller: sellerReducer,
    buyer: buyerReducer,
    permissions: permissionsReducer,
  },
  // middleware: (getDefaultMiddleware) =>
  //   getDefaultMiddleware({
  //     serializableCheck: {
  //       ignoredActions: [
  //         'auth/login/fulfilled',
  //         'auth/register/fulfilled',
  //         'manager/performInspection/pending',
  //         'seller/createAuction/pending',
  //         'seller/updateAuction/pending',
  //       ],
  //       ignoredActionPaths: ['payload.timestamp', 'meta.arg'],
  //       ignoredPaths: ['auth.timestamp'],
  //     },
  //   }),
  // devTools: import.meta.env.DEV,
});

export { store };
export default store;
