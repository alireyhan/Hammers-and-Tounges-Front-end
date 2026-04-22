import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../../services/interceptors/auction.service';
import { fetchCategories } from '../../store/actions/AuctionsActions';
import { toast } from 'react-toastify';
import LotRow from '../../components/LotRow';
import GrvLotDrawer from '../../components/GrvLotDrawer';
import './AdminEventLots.css';
import './AdminGoodsReceivedVerification.css';
import '../GuestEventLots.css';

const lotIsDraft = (lot) =>
  String(lot?.status || lot?.listing_status || '').toUpperCase() === 'DRAFT';

const AdminGoodsReceivedVerification = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const features = useSelector((state) => state.permissions?.features);
  const permissionsLoading = useSelector((state) => state.permissions?.isLoading);
  const lastFetchedUserId = useSelector((state) => state.permissions?.lastFetchedUserId);
  const authUserId = useSelector((state) => state.auth?.user?.id);

  const isManagerFlow = location.pathname.startsWith('/manager');
  const dashboardPath = isManagerFlow ? '/manager/dashboard' : '/admin/dashboard';

  const permsReady =
    !permissionsLoading &&
    lastFetchedUserId != null &&
    authUserId != null &&
    String(lastFetchedUserId) === String(authUserId);

  const manageGrv = features?.manage_grv || {};
  const canAccessManagerGrv =
    manageGrv?.read === true &&
    (manageGrv?.create === true ||
      manageGrv?.update === true ||
      manageGrv?.delete === true);

  const [allLots, setAllLots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [selectedLot, setSelectedLot] = useState(null);

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  const fetchDraftLots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const results = await auctionService.fetchAllLots();
      const drafts = (Array.isArray(results) ? results : []).filter(lotIsDraft);
      setAllLots(drafts);
    } catch (err) {
      console.error(err);
      const msg = err?.message || 'Failed to load lots';
      setError(msg);
      toast.error(msg);
      setAllLots([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!isManagerFlow) {
      fetchDraftLots();
      return;
    }
    if (!permsReady) {
      setLoading(true);
      return;
    }
    if (!canAccessManagerGrv) {
      setLoading(false);
      toast.error('You do not have access to Goods Received Verification.');
      navigate('/manager/dashboard', { replace: true });
      return;
    }
    fetchDraftLots();
  }, [isManagerFlow, permsReady, canAccessManagerGrv, navigate, fetchDraftLots]);

  const filteredLots = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return allLots;
    return allLots.filter((lot) => {
      const title = String(lot?.title || '').toLowerCase();
      const ev = String(lot?.event_title || '').toLowerCase();
      const id = String(lot?.id ?? '');
      const lotNo = String(lot?.lot_number ?? '');
      return title.includes(q) || ev.includes(q) || id.includes(q) || lotNo.includes(q);
    });
  }, [allLots, search]);

  const draftCount = allLots.length;

  return (
    <div
      className={`admin-event-lots admin-grv-page ${selectedLot ? 'admin-event-lots--drawer-open' : ''}`}
    >
      <header className="admin-event-lots__header">
        <button
          type="button"
          className="admin-event-lots__back"
          onClick={() => navigate(dashboardPath)}
          aria-label="Back to dashboard"
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M19 12H5M12 19l-5-7 5-7" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back
        </button>
        <div className="admin-event-lots__header-content">
          <div className="admin-event-lots__header-title-row">
            <h1 className="admin-event-lots__title">Goods Received Verification</h1>
            <span className="admin-event-lots__header-status admin-event-lots__header-status--draft">
              Draft lots
            </span>
          </div>
          <p className="admin-event-lots__subtitle">
            {draftCount} draft lot{draftCount !== 1 ? 's' : ''} · open a lot to manage GRV checklist
          </p>
        </div>
      </header>

      <main className="admin-event-lots__main">
        {loading && allLots.length === 0 ? (
          <div className="admin-event-lots__loading">
            <div className="admin-event-lots__spinner" />
            <p>Loading lots…</p>
          </div>
        ) : error ? (
          <div className="admin-event-lots__error">
            <p>{error}</p>
            <button type="button" onClick={fetchDraftLots}>
              Retry
            </button>
          </div>
        ) : (
          <div className="admin-event-lots__body admin-grv-body-col">
            <div className="admin-event-lots__content admin-grv-content-full">
              <div className="admin-grv-stack">
                <input
                  type="search"
                  className="admin-grv-search"
                  placeholder="Search by title, event, or lot #…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  aria-label="Search draft lots"
                />
              {filteredLots.length === 0 ? (
                <div className="admin-event-lots__empty">
                  <p>{allLots.length === 0 ? 'No draft lots found.' : 'No lots match your search.'}</p>
                </div>
              ) : (
                <div className="guest-event-lots__list admin-grv-lot-list">
                  {filteredLots.map((lot) => (
                    <LotRow
                      key={lot.id}
                      lot={lot}
                      eventTitle={lot.event_title}
                      eventStatus={lot.event_status || 'SCHEDULED'}
                      eventStartTime={lot.event_start_time ?? lot.start_date}
                      eventEndTime={lot.event_end_time ?? lot.end_date ?? lot.end_time}
                      showListingStatus
                      onOpenDetail={setSelectedLot}
                    />
                  ))}
                </div>
              )}
              </div>
            </div>
          </div>
        )}
      </main>

      {selectedLot && (
        <GrvLotDrawer
          lot={selectedLot}
          onClose={() => setSelectedLot(null)}
          onGrvChanged={fetchDraftLots}
        />
      )}
    </div>
  );
};

export default AdminGoodsReceivedVerification;
