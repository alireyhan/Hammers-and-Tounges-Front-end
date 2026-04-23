import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import GuestLayout from "./layouts/GuestLayout";

import Home from "./pages/Home";
import Auctions from "./pages/Auctions";
import GuestBuy from "./pages/GuestBuy";
import GuestSell from "./pages/GuestSell";
import GuestEventLots from "./pages/GuestEventLots";
import GuestLotDetail from "./pages/GuestLotDetail";
import AuctionDetails from "./pages/AuctionDetails";
import About from "./pages/About";
import Contact from "./pages/Contact";

import SignIn from "./pages/SignIn";
import Register from "./pages/Register";
import OTPVerification from "./pages/OTPVerification";

import BuyerDashboard from "./pages/BuyerDashboard";
import BuyerAuctions from "./pages/BuyerAuctions";
import BuyerEventLots from "./pages/BuyerEventLots";
import BuyerBuy from "./pages/BuyerBuy";
import BuyerAuctionDetails from "./pages/BuyerAuctionDetails";
import BuyerBids from "./pages/BuyerBids";
import BuyerWonItems from "./pages/BuyerWonItems";
import BuyerWallet from "./pages/BuyerWallet";
import BuyerProfile from "./pages/BuyerProfile";
import BuyerAddBalance from "./pages/BuyerAddBalance";
import BuyerSell from "./pages/BuyerSell";
import FavoriteAuctions from "./pages/FavoriteAuctions";

import SellerDashboard from "./pages/SellerDashboard";
import SellerLotDetail from "./pages/SellerLotDetail";
import SellerAuctionListings from "./pages/SellerAuctionListings";
import SellerListingDetails from "./pages/SellerAuctionDetails";
import SellerAnalytics from "./pages/SellerAnalytics";
import SellerProductCreate from "./pages/SellerCreateProduct";
import SellerProfile from "./pages/sellerProfile/SellerProfile";
import SellerKYCVerification from "./pages/sellerProfile/SellerKYCVerification";

// Manager
import ManagerDashboard from "./pages/ManagerDashboard";
import ManagerBuy from "./pages/ManagerBuy";
import ManagerSell from "./pages/ManagerSell";
import ManagerCreateEvent from "./pages/ManagerCreateEvent";
import ManagerEventLots from "./pages/ManagerEventLots";
import ManagerInspection from "./pages/ManagerInspection";
import ManagerPublishNew from './pages/ManagerPublishNew'
import ManagerLiveAuctions from './pages/ManagerLiveAuctions'
import ManagerAuctionControlPanel from './pages/ManagerAuctionControlPanel'
import ManagerAuctionResults from './pages/ManagerAuctionResults'
import ManagerAuctionDetails from './pages/ManagerAuctionDetails'
import ManagerLotDetail from './pages/ManagerLotDetail'
import CategoryManagement from './pages/categoryManagement/CategoryManagement'
import ManagerCreateCategory from './pages/managerCreateCategory/ManagerCreateCategory'
import ManagerProductFields from './pages/managerProductFields/ManagerProductFields'

// Admin
import AdminDashboard from "./pages/adminDashboard/AdminDashboard";
import AdminBuy from "./pages/AdminBuy";
import AdminEventLots from "./pages/adminDashboard/AdminEventLots";
import AdminLotDetail from "./pages/adminDashboard/AdminLotDetail";
import AdminCreateEvent from "./pages/adminDashboard/AdminCreateEvent";
import AdminEditEvent from "./pages/adminDashboard/AdminEditEvent";
import AdminAuctionDetails from "./pages/adminDashboard/AdminAuctionDetails";
import AdminSell from "./pages/AdminSell";
import AdminFinance from './pages/AdminFinance'
import ManualDepositDetail from './pages/ManualDepositDetail'
import AdminUnsoldInventory from './pages/AdminUnsoldInventory'
import AdminDepositExemption from './pages/AdminDepositExemption'
import AdminAuctionDepositOverride from './pages/AdminAuctionDepositOverride'
import AdminGoodsReceivedVerification from './pages/adminDashboard/AdminGoodsReceivedVerification'
import ManualPaymentEntry from './components/ManualPayment'
import ManualPaymentAuthorization from './pages/ManualPaymentAuthorization'
import PaymentVerification from './pages/paymentVerification/PaymentVerification'
import UserManagement from './pages/userManagement/UserManagement'
import AdminManagerKYC from './pages/userManagement/AdminManagerKYC'
import AdminManagerDetails from './pages/userManagement/AdminManagerDetails'
import AdminCreateManager from './pages/userManagement/AdminCreateManager'
import AdminCreateSeller from './pages/userManagement/AdminCreateSeller'
import AdminEditSeller from './pages/userManagement/AdminEditSeller'
import AdminCreateClerk from './pages/userManagement/AdminCreateClerk'
import AdminRoleManagement from './pages/userManagement/AdminRoleManagement'

// Route Guards
import BuyerGuard from "./guards/BuyerGuard";
import SellerGuard from "./guards/SellerGuard";
import ManagerGuard from "./guards/ManagerGuard";
import AdminGuard from "./guards/AdminGuard";
import ClerkGuard from "./guards/ClerkGuard";

// All Role's Layouts
import BuyerLayout from "./layouts/BuyerLayout";
import SellerLayout from "./layouts/SellerLayout";
import ManagerLayout from "./layouts/ManagerLayout";
import AdminLayout from "./layouts/AdminLayout";
import ClerkLayout from "./layouts/ClerkLayout";
import { Provider } from "react-redux";
import store from './store/store'

import { Bounce, ToastContainer } from "react-toastify";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import BuyerBidDetails from "./components/BuyerBidDetails";
import LotDetailReadOnly from "./components/LotDetailReadOnly";
import ClerkDashboard from "./pages/ClerkDashboard";
import ClerkEventLots from "./pages/ClerkEventLots";
function App() {
  return (
    <Provider store={store}>
      <Router>
        <div className="app">
          <Routes>
            {/* Public Routes - Guest flow with side drawer */}
            <Route element={<GuestLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/auctions" element={<Auctions />} />
              <Route path="/event/:eventId" element={<GuestEventLots />} />
              <Route path="/buy" element={<GuestBuy />} />
              <Route path="/sell" element={<GuestSell />} />
              <Route path="/lot/:lotId" element={<GuestLotDetail />} />
              <Route path="/auction/:id" element={<AuctionDetails />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/register" element={<Register />} />
            </Route>
            <Route path="/otp-verification" element={<OTPVerification />} />
            {/* // New // */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Buyer Routes */}
            <Route element={<BuyerGuard />}>
              <Route element={<BuyerLayout />}>
                <Route path="/buyer/dashboard" element={<BuyerDashboard />} />
                <Route path="/buyer/buy" element={<BuyerBuy />} />
                <Route path="/buyer/sell" element={<BuyerSell />} />
                <Route path="/buyer/event/:eventId" element={<BuyerEventLots />} />
                <Route path="/buyer/auctions" element={<BuyerAuctions />} />
                <Route path="/buyer/auction/:id" element={<BuyerAuctionDetails />} />
                <Route path="/buyer/bid/:id" element={<BuyerBidDetails />} />
                <Route path="/buyer/bids" element={<BuyerBids />} />
                <Route path="/buyer/won-items" element={<BuyerWonItems />} />
                <Route path="/buyer/wallet" element={<BuyerWallet />} />
                <Route path="/buyer/profile" element={<BuyerProfile />} />
                <Route path="/buyer/add-balance" element={<BuyerAddBalance />} />
                <Route path="/buyer/favorite-items" element={<FavoriteAuctions />} />
              </Route>
            </Route>

            {/* Seller Routes */}
            <Route element={<SellerGuard />}>
              <Route element={<SellerLayout />}>
                <Route path="/seller/dashboard" element={<SellerDashboard />} />
                <Route path="/seller/lot/:lotId" element={<SellerLotDetail />} />
                <Route path="/seller/auction-listings" element={<SellerAuctionListings />} />
                <Route path="/seller/listing/:id" element={<SellerListingDetails />} />
                <Route path="/seller/product" element={<SellerProductCreate />} />
                <Route path="/seller/analytics" element={<SellerAnalytics />} />
                <Route path="/seller/profile" element={<SellerProfile />} />
                <Route path="/seller/kyc-verification" element={<SellerKYCVerification />} />
              </Route>
            </Route>

            {/* Manager Routes */}
            <Route element={<ManagerGuard />}>
              <Route element={<ManagerLayout />}>
                <Route path="/manager/dashboard" element={<ManagerDashboard />} />
                <Route path="/manager/buy" element={<ManagerBuy />} />
                <Route path="/manager/sell" element={<ManagerSell />} />
                <Route path="/manager/buy/lot/:lotId" element={<LotDetailReadOnly backPath="/manager/buy" />} />
                <Route path="/manager/event/create" element={<ManagerCreateEvent />} />
                <Route path="/manager/event/:eventId/lot/:lotId" element={<ManagerLotDetail />} />
                <Route path="/manager/event/:id" element={<ManagerEventLots />} />
                <Route path="/manager/inspection" element={
                  <>
                    <ManagerInspection />
                  </>
                } />

                <Route path="/manager/auctions" element={<Navigate to="/manager/dashboard" replace />} />

                <Route path="/manager/publishnew" element={
                  <>
                    <ManagerPublishNew />
                  </>
                } />
                <Route path="/manager/live-auctions" element={
                  <>
                    <ManagerLiveAuctions />
                  </>
                } />
                <Route path="/manager/auction-results" element={
                  <>
                    <ManagerAuctionResults />
                  </>
                } />
                <Route path="/manager/controlpanel" element={
                  <>
                    <ManagerAuctionControlPanel />
                  </>
                } />
                <Route path="/manager/auction-details" element={
                  <>
                    <ManagerAuctionDetails />
                  </>
                } />

                {/* Category Management moved to admin flow */}
                {/* <Route path="/manager/category" element={
                  <>
                    <CategoryManagement />
                  </>
                } />
                <Route path="/manager/add-category" element={
                  <>
                    <ManagerCreateCategory />
                  </>
                } />
                <Route path="/manager/product-fields" element={
                  <>
                    <ManagerProductFields />
                  </>
                } /> */}

                {/* Manager equivalents for admin tabs */}
                <Route path="/manager/users" element={
                  <>
                    <UserManagement />
                  </>
                } />
                <Route path="/manager/category" element={
                  <>
                    <CategoryManagement />
                  </>
                } />
                <Route path="/manager/add-category" element={
                  <>
                    <ManagerCreateCategory />
                  </>
                } />
                <Route path="/manager/edit-category" element={
                  <>
                    <ManagerCreateCategory />
                  </>
                } />
                <Route path="/manager/product-fields" element={
                  <>
                    <ManagerProductFields />
                  </>
                } />
                <Route path="/manager/unsold-inventory" element={<AdminUnsoldInventory />} />
                <Route path="/manager/deposit-exemption" element={<AdminDepositExemption />} />
                <Route path="/manager/auction-deposit-override" element={<AdminAuctionDepositOverride />} />
                <Route path="/manager/goods-received-verification" element={<AdminGoodsReceivedVerification />} />
                <Route path="/manager/finance/manual-deposits/:depositId" element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="/manager/finance" element={<Navigate to="/manager/dashboard" replace />} />
                <Route path="/manager/role-management/:id" element={
                  <>
                    <AdminRoleManagement />
                  </>
                } />
                <Route path="/manager/manager/:id" element={
                  <>
                    <AdminManagerDetails />
                  </>
                } />
                <Route path="/manager/manager/create" element={
                  <>
                    <AdminCreateManager />
                  </>
                } />
                <Route path="/manager/clerk/create" element={
                  <>
                    <AdminCreateClerk />
                  </>
                } />
                <Route path="/manager/seller/create" element={
                  <>
                    <AdminCreateSeller />
                  </>
                } />
                <Route path="/manager/seller/edit/:id" element={
                  <>
                    <AdminEditSeller />
                  </>
                } />

              </Route>
            </Route>

            {/* Clerk Routes */}
            <Route element={<ClerkGuard />}>
              <Route element={<ClerkLayout />}>
                <Route path="/clerk/dashboard" element={<ClerkDashboard />} />
                <Route path="/clerk/event/:id" element={<ClerkEventLots />} />
                <Route path="/clerk/event/create" element={<ManagerCreateEvent />} />
                {/* Reuse lot creation screen, but it enforces clerk restrictions */}
                <Route path="/clerk/publishnew" element={<ManagerPublishNew />} />
              </Route>
            </Route>

            {/* Admin Routes */}
            <Route element={<AdminGuard />}>
              <Route element={<AdminLayout />}>
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/dashboard" element={<AdminDashboard />} />
                <Route path="/admin/event/create" element={<AdminCreateEvent />} />
                <Route path="/admin/event/:eventId/edit" element={<AdminEditEvent />} />
                <Route path="/admin/publishnew" element={<ManagerPublishNew />} />
                <Route path="/admin/buy" element={<AdminBuy />} />
                <Route path="/admin/sell" element={<AdminSell />} />
                <Route path="/admin/buy/lot/:lotId" element={<LotDetailReadOnly backPath="/admin/buy" />} />
                <Route path="/admin/event/:id" element={<AdminEventLots />} />
                <Route path="/admin/event/:eventId/lot/:lotId" element={<AdminLotDetail />} />
                <Route path="/admin/auction/:id" element={<AdminAuctionDetails />} />
                <Route path="/admin/unsold-inventory" element={<AdminUnsoldInventory />} />
                <Route path="/admin/deposit-exemption" element={<AdminDepositExemption />} />
                <Route path="/admin/goods-received-verification" element={<AdminGoodsReceivedVerification />} />
                <Route path="/admin/auction-deposit-override" element={<AdminAuctionDepositOverride />} />
                <Route path="/admin/finance/manual-deposits/:depositId" element={<ManualDepositDetail />} />
                <Route path="/admin/finance" element={<AdminFinance />} />
                <Route path="/admin/finance/manual-payments" element={
                  <>
                    <ManualPaymentEntry />
                  </>
                } />

                <Route path="/admin/finance/manual/payments-authorization" element={
                  <>
                    <ManualPaymentAuthorization />
                  </>
                } />
                <Route path="/admin/finance/manual/payments-verification" element={
                  <>
                    <PaymentVerification />
                  </>
                } />
                <Route path="/admin/users" element={
                  <>
                    <UserManagement />
                  </>
                } />
                <Route path="/admin/kycverification/:id" element={
                  <>
                    <AdminManagerKYC />
                  </>
                } />
                <Route path="/admin/manager/:id" element={
                  <>
                    <AdminManagerDetails />
                  </>
                } />
                <Route path="/admin/role-management/:id" element={
                  <>
                    <AdminRoleManagement />
                  </>
                } />
                <Route path="/admin/manager/create" element={
                  <>
                    <AdminCreateManager />
                  </>
                } />
                <Route path="/admin/clerk/create" element={
                  <>
                    <AdminCreateClerk />
                  </>
                } />
                <Route path="/admin/seller/create" element={
                  <>
                    <AdminCreateSeller />
                  </>
                } />
                <Route path="/admin/seller/edit/:id" element={
                  <>
                    <AdminEditSeller />
                  </>
                } />
                <Route path="/admin/category" element={
                  <>
                    <CategoryManagement />
                  </>
                } />
                <Route path="/admin/add-category" element={
                  <>
                    <ManagerCreateCategory />
                  </>
                } />
                <Route path="/admin/edit-category" element={
                  <>
                    <ManagerCreateCategory />
                  </>
                } />
                <Route path="/admin/product-fields" element={
                  <>
                    <ManagerProductFields />
                  </>
                } />

              </Route>
            </Route>

          </Routes>
          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick={false}
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="light"
            transition={Bounce}
          />
        </div>
      </Router>
    </Provider>
  );
}

export default App;
