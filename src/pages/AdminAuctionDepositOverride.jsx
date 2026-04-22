import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { auctionService } from "../services/interceptors/auction.service";
import { toast } from "react-toastify";
import "./AdminAuctionDepositOverride.css";

const EVENT_ALLOWED_STATUSES = new Set(["LIVE", "SCHEDULED"]);

/** Shown when API has no deposit_multiplier_override (platform default is 10x). */
const DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY = "10x";

const normalizeStatus = (value) => String(value || "").toUpperCase();

const parseOverrideValue = (value) => {
  const raw = String(value ?? "").trim();
  if (!raw) return "";
  const numericMatch = raw.match(/^\s*([0-9]+(?:\.[0-9]+)?)\s*[a-zA-Z]*\s*$/);
  if (!numericMatch) return null;
  const normalized = numericMatch[1];
  const n = Number(normalized);
  if (Number.isNaN(n) || n < 0) return null;
  return normalized;
};

/** Show API / saved numeric value in the input as e.g. 2x, 2.5x */
const formatOverrideForField = (numericString) => {
  if (numericString === "" || numericString == null) return "";
  const n = Number(numericString);
  if (Number.isNaN(n) || n < 0) return "";
  const base = Number.isInteger(n) ? String(Math.trunc(n)) : String(n);
  return `${base}x`;
};

const getEventOverrideDisplay = (event) => {
  const raw =
    event?.deposit_multiplier_override ??
    event?.deposit_multiplier ??
    "";
  if (raw == null || String(raw).trim() === "") {
    return DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY;
  }
  const parsed = parseOverrideValue(raw);
  if (parsed === null || parsed === "") {
    return DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY;
  }
  return formatOverrideForField(parsed);
};

/**
 * Row: LIVE/SCHEDULED event that has at least one lot.
 */
const AdminAuctionDepositOverride = () => {
  const location = useLocation();
  const features = useSelector((state) => state.permissions?.features);
  const permissionsLoading = useSelector((state) => state.permissions?.isLoading);
  const lastFetchedUserId = useSelector((state) => state.permissions?.lastFetchedUserId);
  const authUserId = useSelector((state) => state.auth?.user?.id);
  const isManagerFlow = location.pathname.startsWith("/manager");
  const permissionsReady =
    !permissionsLoading &&
    lastFetchedUserId != null &&
    String(lastFetchedUserId) === String(authUserId);
  const canUpdateEvents = features?.manage_events?.update === true;
  const inputsLocked = isManagerFlow && (!permissionsReady || !canUpdateEvents);

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [search, setSearch] = useState("");
  const [draftMap, setDraftMap] = useState({});
  const [savingMap, setSavingMap] = useState({});

  const loadRows = useCallback(async () => {
    setLoading(true);
    try {
      const all = await auctionService.fetchAllEvents({}, { forceRefresh: true });
      const candidates = (Array.isArray(all) ? all : []).filter((ev) =>
        EVENT_ALLOWED_STATUSES.has(normalizeStatus(ev?.status))
      );

      const built = [];
      for (const ev of candidates) {
        const eventId = ev?.id;
        if (eventId == null) continue;

        let lotsRes;
        try {
          lotsRes = await auctionService.getLots({
            event: eventId,
            page: 1,
            page_size: 50,
          });
        } catch {
          continue;
        }

        const count = lotsRes?.count ?? 0;
        const firstPage = Array.isArray(lotsRes?.results) ? lotsRes.results : [];
        if (count === 0 && firstPage.length === 0) continue;

        let detail = ev;
        try {
          detail = await auctionService.getEvent(eventId);
        } catch {
          // keep list row from events feed
        }

        built.push({
          id: eventId,
          title: detail?.title ?? ev?.title,
          status: detail?.status ?? ev?.status,
          event_code: detail?.event_code ?? ev?.event_code,
          lotCount: count || firstPage.length,
          deposit_multiplier_override: detail?.deposit_multiplier_override,
        });
      }

      setRows(built);
      setDraftMap(
        built.reduce((acc, r) => {
          acc[r.id] = getEventOverrideDisplay(r);
          return acc;
        }, {})
      );
    } catch (err) {
      toast.error(err?.message || "Failed to load events");
      setRows([]);
      setDraftMap({});
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRows();
  }, [loadRows]);

  const filteredRows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return rows;
    return rows.filter((r) => {
      const title = String(r?.title || "").toLowerCase();
      const code = String(r?.event_code || r?.id || "").toLowerCase();
      return title.includes(q) || code.includes(q);
    });
  }, [rows, search]);

  const handleSave = async (row) => {
    if (inputsLocked) {
      toast.info("You need event update access to change deposit multiplier overrides.");
      return;
    }
    const eventId = row?.id;
    if (eventId == null) return;

    const raw = draftMap[eventId];
    const parsed = parseOverrideValue(raw);
    if (parsed === null) {
      toast.error("Deposit multiplier override must be a valid non-negative number.");
      return;
    }

    setSavingMap((prev) => ({ ...prev, [eventId]: true }));
    try {
      // Auction event PATCH for this screen: only override field (never send title).
      await auctionService.updateEvent(eventId, {
        deposit_multiplier_override: parsed === "" ? null : parsed,
      });
      toast.success(`Updated deposit multiplier for ${row.title || `Event #${eventId}`}.`);
      setRows((prev) =>
        prev.map((r) =>
          r.id === eventId ? { ...r, deposit_multiplier_override: parsed === "" ? null : parsed } : r
        )
      );
      setDraftMap((prev) => ({
        ...prev,
        [eventId]:
          parsed === "" ? DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY : formatOverrideForField(parsed),
      }));
    } catch (err) {
      const msg =
        err?.response?.data?.detail ||
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update event";
      toast.error(typeof msg === "string" ? msg : "Failed to update event");
    } finally {
      setSavingMap((prev) => ({ ...prev, [eventId]: false }));
    }
  };

  return (
    <div className="ado-page">
      <header className="ado-header">
        <div>
          <h1 className="ado-title">Auction Control: Deposit Multiplier Override</h1>
          <p className="ado-subtitle">
            Set deposit multiplier override per event (applies to the whole auction). Only events with
            at least one lot are listed.
          </p>
          <p className="ado-default-note">
            Default multiplier is <strong>10x</strong>.
          </p>
        </div>
      </header>

      <div className="ado-toolbar">
        <input
          className="ado-search ado-search--full"
          type="text"
          placeholder="Search events..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          disabled={loading}
        />
      </div>

      {loading ? (
        <div className="ado-state">Loading events with lots...</div>
      ) : filteredRows.length === 0 ? (
        <div className="ado-state">
          No live or scheduled events with lots match your search.
        </div>
      ) : (
        <div className="ado-table-wrap">
          <table className="ado-table">
            <thead>
              <tr>
                <th>Event</th>
                <th>Status</th>
                <th>Lots</th>
                <th>Deposit multiplier override</th>
                {!inputsLocked && <th>Action</th>}
              </tr>
            </thead>
            <tbody>
              {filteredRows.map((row) => {
                const eventId = row.id;
                const saving = !!savingMap[eventId];
                return (
                  <tr key={eventId}>
                    <td>
                      <div className="ado-event-cell-title">{row.title || `Event #${eventId}`}</div>
                      <div className="ado-event-cell-meta">{row.event_code || `#${eventId}`}</div>
                    </td>
                    <td>{normalizeStatus(row.status)}</td>
                    <td>{row.lotCount}</td>
                    <td>
                      <input
                        type="text"
                        className="ado-input"
                        readOnly={inputsLocked}
                        value={draftMap[eventId] ?? DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY}
                        onChange={(e) =>
                          setDraftMap((prev) => ({ ...prev, [eventId]: e.target.value }))
                        }
                        placeholder={DEFAULT_DEPOSIT_MULTIPLIER_DISPLAY}
                        disabled={saving}
                        aria-label={`Deposit multiplier override for ${row.title}`}
                      />
                    </td>
                    {!inputsLocked && (
                      <td>
                        <button
                          type="button"
                          className="ado-save-btn"
                          onClick={() => handleSave(row)}
                          disabled={saving}
                        >
                          {saving ? "Saving..." : "Save"}
                        </button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default AdminAuctionDepositOverride;
