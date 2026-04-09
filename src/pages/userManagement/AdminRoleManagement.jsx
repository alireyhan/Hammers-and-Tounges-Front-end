import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserPermissions } from "../../store/actions/permissionsActions";
import "./AdminRoleManagement.css";

/** Read is always true (not shown as a toggle). */
const DEFAULT_TOGGLE_PERMISSION_KEYS = ["create", "update", "delete"];

const makeDefaultFeaturePermissions = () => ({
  read: true,
  create: false,
  update: false,
  delete: false
});

const withReadAlwaysTrue = (perms) => ({
  ...(perms || makeDefaultFeaturePermissions()),
  read: true
});

const normalizeFeaturePermissions = (featureKey, src) => ({
  // GRV read must remain true even if backend returns false.
  read: featureKey === "manage_grv" ? true : true,
  create: !!src.create,
  update: !!src.update,
  delete: !!src.delete
});

const makeReadOnlyFeaturePermissions = () => ({
  read: true,
  create: false,
  update: false,
  delete: false
});

const FEATURE_LABELS = {
  manage_users: "User management",
  manage_events: "Event management",
  manage_categories: "Category management",
  manage_grv: "GRV management",
  deposit_exempt: "Deposit exempt"
};

const FEATURE_PERMISSION_KEYS = {
  manage_users: DEFAULT_TOGGLE_PERMISSION_KEYS,
  manage_events: DEFAULT_TOGGLE_PERMISSION_KEYS,
  manage_categories: DEFAULT_TOGGLE_PERMISSION_KEYS,
  manage_grv: DEFAULT_TOGGLE_PERMISSION_KEYS,
  deposit_exempt: ["create"]
};

const PERMISSION_DESCRIPTIONS = {
  create: "Create access",
  update: "Update access",
  delete: "Delete access"
};

const PermissionSwitch = ({ checked, onChange, label }) => {
  return (
    <label className="rm-switch" aria-label={label}>
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="rm-switch-slider" aria-hidden="true" />
    </label>
  );
};

const AdminRoleManagement = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const location = useLocation();
  const dispatch = useDispatch();
  const authUserId = useSelector((state) => state.auth?.user?.id);

  const roleType = location.state?.role || "manager"; // "manager" | "clerk"
  const user = location.state?.user;
  const basePath = location.pathname.startsWith("/manager")
    ? "/manager"
    : "/admin";
  const targetUserId = id ?? user?.id ?? user?.user_id ?? user?.userId ?? null;

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [featurePermissions, setFeaturePermissions] = useState({});

  const featuresToShow = useMemo(() => {
    if (roleType === "clerk") return ["manage_events", "manage_grv", "deposit_exempt"];
    return [
      "manage_users",
      "manage_events",
      "manage_categories",
      "manage_grv",
      "deposit_exempt"
    ];
  }, [roleType]);

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const data = await adminService.getUserPermissions(targetUserId);
        const incoming = data?.feature_permissions || {};

        // Normalize per feature; read is always true (not user-toggleable).
        const normalized = {};
        for (const featureKey of Object.keys(incoming)) {
          const src = incoming?.[featureKey] || {};
          normalized[featureKey] = normalizeFeaturePermissions(featureKey, src);
        }

        // Ensure expected keys exist (important for UI toggles).
        for (const featureKey of [
          "manage_users",
          "manage_events",
          "manage_categories",
          "manage_grv",
          "deposit_exempt"
        ]) {
          if (!normalized[featureKey])
            normalized[featureKey] = makeDefaultFeaturePermissions();
          else {
            normalized[featureKey] = {
              ...makeDefaultFeaturePermissions(),
              ...normalized[featureKey]
            };
          }
        }

        // Product rule: GRV read is always true in admin flow,
        // regardless of what backend returns.
        normalized.manage_grv = withReadAlwaysTrue(normalized.manage_grv);

        setFeaturePermissions(normalized);
      } catch (err) {
        const message =
          err?.response?.data?.message ||
          err?.response?.data?.error ||
          err?.message ||
          "Failed to load permissions";
        toast.error(message);
      } finally {
        setIsLoading(false);
      }
    };

    if (targetUserId != null) fetchPermissions();
  }, [targetUserId]);

  const headerSubtitle = useMemo(() => {
    const name =
      user?.full_name || user?.display_name || user?.email || "Selected user";
    return `${roleType.toUpperCase()} • ${name}`;
  }, [roleType, user]);

  const handleToggle = (featureKey, permissionKey, value) => {
    setFeaturePermissions((prev) => {
      const currentFeature =
        prev?.[featureKey] || makeDefaultFeaturePermissions();
      return {
        ...prev,
        [featureKey]: {
          ...currentFeature,
          [permissionKey]: value
        }
      };
    });
  };

  const handleSave = async () => {
    if (targetUserId == null) {
      toast.error("Cannot update permissions: target user ID is missing.");
      return;
    }

    setIsSaving(true);
    try {
      const payload =
        roleType === "clerk"
          ? {
              feature_permissions: {
                manage_events: withReadAlwaysTrue(
                  featurePermissions.manage_events
                ),
                // Keep users/categories read-only for clerk users.
                manage_users: makeReadOnlyFeaturePermissions(),
                manage_categories: makeReadOnlyFeaturePermissions(),
                manage_grv: {
                  ...withReadAlwaysTrue(featurePermissions.manage_grv),
                  read: true
                },
                deposit_exempt: withReadAlwaysTrue(
                  featurePermissions.deposit_exempt
                )
              }
            }
          : {
              feature_permissions: {
                manage_users: withReadAlwaysTrue(
                  featurePermissions.manage_users
                ),
                manage_events: withReadAlwaysTrue(
                  featurePermissions.manage_events
                ),
                manage_categories: withReadAlwaysTrue(
                  featurePermissions.manage_categories
                ),
                manage_grv: {
                  ...withReadAlwaysTrue(featurePermissions.manage_grv),
                  read: true
                },
                deposit_exempt: withReadAlwaysTrue(
                  featurePermissions.deposit_exempt
                )
              }
            };

      await adminService.updateUserPermissions(targetUserId, payload);
      toast.success("Permissions updated successfully!");

      // If the currently logged-in user updated their own permissions,
      // refresh Redux so tabs/actions reflect the new access immediately.
      if (authUserId != null && String(authUserId) === String(targetUserId)) {
        dispatch(fetchUserPermissions(authUserId));
      }

      navigate(`${basePath}/users`, { state: { role: roleType } });
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        err?.message ||
        "Failed to update permissions";
      toast.error(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleBack = () => {
    navigate(`${basePath}/users`, { state: { role: roleType } });
  };

  if (isLoading) {
    return (
      <div className="rm-page">
        <div className="rm-container">
          <div className="rm-loading">
            <div className="rm-loading-spinner" />
            <p>Loading role permissions...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="rm-page">
      <div className="rm-container">
        <header className="rm-header">
          <div>
            <h1 className="rm-title">Role Management</h1>
            <p className="rm-subtitle">{headerSubtitle}</p>
          </div>
          <div className="rm-header-actions">
            <button
              className="rm-btn rm-btn-secondary"
              onClick={handleBack}
              disabled={isSaving}
            >
              Back
            </button>
            <button
              className="rm-btn rm-btn-primary"
              onClick={handleSave}
              disabled={isSaving}
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        <div className="rm-grid">
          {featuresToShow.map((featureKey) => {
            const featureValue =
              featurePermissions?.[featureKey] ||
              makeDefaultFeaturePermissions();
            return (
              <section key={featureKey} className="rm-feature-card">
                <div className="rm-feature-title">
                  {FEATURE_LABELS[featureKey] || featureKey}
                </div>
                <div className="rm-permission-list">
                  {(FEATURE_PERMISSION_KEYS[featureKey] ||
                    DEFAULT_TOGGLE_PERMISSION_KEYS
                  ).map((permissionKey) => (
                    <div key={permissionKey} className="rm-permission-row">
                      <div className="rm-permission-meta">
                        <div className="rm-permission-name">
                          {permissionKey.charAt(0).toUpperCase() +
                            permissionKey.slice(1)}
                        </div>
                        <div className="rm-permission-desc">
                          {PERMISSION_DESCRIPTIONS[permissionKey] || ""}
                        </div>
                      </div>
                      <PermissionSwitch
                        checked={featureValue[permissionKey]}
                        onChange={(v) =>
                          handleToggle(featureKey, permissionKey, v)
                        }
                        label={`${
                          FEATURE_LABELS[featureKey] || featureKey
                        } - ${permissionKey}`}
                      />
                    </div>
                  ))}
                </div>
              </section>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default AdminRoleManagement;
