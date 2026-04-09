import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { adminService } from "../services/interceptors/admin.service";
import { toast } from "react-toastify";
import "./AdminDepositExemption.css";

const getUserDisplayName = (user) => {
  const full =
    user?.full_name ||
    user?.display_name ||
    [user?.first_name, user?.last_name].filter(Boolean).join(" ").trim();
  return full || user?.email || `User #${user?.id ?? "N/A"}`;
};

const AdminDepositExemption = () => {
  const location = useLocation();
  const features = useSelector((state) => state.permissions?.features);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingMap, setIsSavingMap] = useState({});
  const [buyers, setBuyers] = useState([]);
  const [search, setSearch] = useState("");
  const isManagerFlow = location.pathname.startsWith("/manager");
  const hasManagerDepositExemptAccess = !isManagerFlow || features?.deposit_exempt?.create === true;

  const loadBuyers = useCallback(async () => {
    if (!hasManagerDepositExemptAccess) {
      setBuyers([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const data = await adminService.getUsersList({ role: "buyer", page: 1, page_size: 200 });
      setBuyers(Array.isArray(data?.results) ? data.results : []);
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to load buyers";
      toast.error(message);
      setBuyers([]);
    } finally {
      setIsLoading(false);
    }
  }, [hasManagerDepositExemptAccess]);

  useEffect(() => {
    loadBuyers();
  }, [loadBuyers]);

  const filteredBuyers = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return buyers;
    return buyers.filter((user) => {
      const name = getUserDisplayName(user).toLowerCase();
      const email = String(user?.email || "").toLowerCase();
      return name.includes(q) || email.includes(q);
    });
  }, [buyers, search]);

  const handleToggle = async (user) => {
    const userId = user?.id ?? user?.user_id ?? user?.userId;
    if (userId == null) return;

    const current = !!user?.is_deposit_exempt;
    const nextValue = !current;

    setIsSavingMap((prev) => ({ ...prev, [userId]: true }));
    setBuyers((prev) =>
      prev.map((u) => (String(u?.id ?? u?.user_id ?? u?.userId) === String(userId) ? { ...u, is_deposit_exempt: nextValue } : u))
    );

    try {
      await adminService.updateUser(userId, { is_deposit_exempt: nextValue });
      toast.success(`Deposit exemption ${nextValue ? "enabled" : "disabled"} for ${getUserDisplayName(user)}.`);
    } catch (err) {
      setBuyers((prev) =>
        prev.map((u) => (String(u?.id ?? u?.user_id ?? u?.userId) === String(userId) ? { ...u, is_deposit_exempt: current } : u))
      );
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update deposit exemption";
      toast.error(message);
    } finally {
      setIsSavingMap((prev) => ({ ...prev, [userId]: false }));
    }
  };

  return (
    <div className="dep-page">
      <header className="dep-header">
        <div>
          <h1 className="dep-title">Deposit Exemption</h1>
          <p className="dep-subtitle">
            Enable or disable deposit exemption for buyer users.
          </p>
        </div>
      </header>

      {!hasManagerDepositExemptAccess ? (
        <div className="dep-loading">
          <p>You do not have access to Deposit Exemption.</p>
        </div>
      ) : (
        <>

          <div className="dep-filters">
            <input
              type="text"
              className="dep-search"
              placeholder="Search buyers by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              disabled={isLoading}
            />
          </div>

          {isLoading ? (
            <div className="dep-loading">
              <div className="dep-loading-spinner" />
              <p>Loading buyers...</p>
            </div>
          ) : (
            <div className="dep-table-wrap">
              <table className="dep-table">
                <thead>
                  <tr>
                    <th>User</th>
                    <th>Email</th>
                    <th>Deposit Exempt</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBuyers.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="dep-empty">
                        No buyer users found.
                      </td>
                    </tr>
                  ) : (
                    filteredBuyers.map((user) => {
                      const userId = user?.id ?? user?.user_id ?? user?.userId;
                      const isSaving = !!isSavingMap[userId];
                      const checked = !!user?.is_deposit_exempt;
                      return (
                        <tr key={String(userId)}>
                          <td>{getUserDisplayName(user)}</td>
                          <td>{user?.email || "—"}</td>
                          <td>
                            <label className="dep-switch" aria-label={`Toggle deposit exemption for ${getUserDisplayName(user)}`}>
                              <input
                                type="checkbox"
                                checked={checked}
                                disabled={isSaving}
                                onChange={() => handleToggle(user)}
                              />
                              <span className="dep-slider" />
                            </label>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminDepositExemption;
