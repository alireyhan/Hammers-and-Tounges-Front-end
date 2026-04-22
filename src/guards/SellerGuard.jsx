import { Outlet } from "react-router-dom";

// Design/demo guard: always allow access so routes can be explored
// without requiring real authentication or API calls.
const SellerGuard = () => {
  return <Outlet />;
};

export default SellerGuard;
