import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { adminService } from "../../services/interceptors/admin.service";
import { toast } from "react-toastify";
import { useDispatch, useSelector } from "react-redux";
import { fetchUserPermissions } from "../../store/actions/permissionsActions";
import "./AdminRoleManagement.css";

const PERMISSION_KEYS = ["read", "create", "update", "delete"];

const makeDefaultFeaturePermissions = () => ({
  read: false,
  create: false,
  update: false,
  delete: false,
});

const FEATURE_LABELS = {
  manage_users: "User management",
  manage_events: "Event management",
  manage_categories: "Category management",
};

const PERMISSION_DESCRIPTIONS = {
  read: "View access",
  create: "Create access",
  update: "Update access",
  delete: "Delete access",
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
  const basePath = location.pathname.startsWith("/manager") ? "/manager" : "/admin";

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [featurePermissions, setFeaturePermissions] = useState({});

  const featuresToShow = useMemo(() => {
    if (roleType === "clerk") return ["manage_events"];
    return ["manage_users", "manage_events", "manage_categories"];
  }, [roleType]);

  useEffect(() => {
    const fetchPermissions = async () => {
      setIsLoading(true);
      try {
        const data = await adminService.getUserPermissions(id);
        const incoming = data?.feature_permissions || {};

        // Normalize to ensure all 4 keys exist per feature.
        const normalized = {};
        for (const featureKey of Object.keys(incoming)) {
          const src = incoming?.[featureKey] || {};
          normalized[featureKey] = {
            read: !!src.read,
            create: !!src.create,
            update: !!src.update,
            delete: !!src.delete,
          };
        }

        // Ensure expected keys exist (important for UI toggles).
        for (const featureKey of ["manage_users", "manage_events", "manage_categories"]) {
          if (!normalized[featureKey]) normalized[featureKey] = makeDefaultFeaturePermissions();
          else {
            normalized[featureKey] = {
              ...makeDefaultFeaturePermissions(),
              ...normalized[featureKey],
            };
          }
        }

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

    if (id) fetchPermissions();
  }, [id]);

  const headerSubtitle = useMemo(() => {
    const name = user?.full_name || user?.display_name || user?.email || "Selected user";
    return `${roleType.toUpperCase()} • ${name}`;
  }, [roleType, user]);

  const handleToggle = (featureKey, permissionKey, value) => {
    setFeaturePermissions((prev) => {
      const currentFeature = prev?.[featureKey] || makeDefaultFeaturePermissions();
      return {
        ...prev,
        [featureKey]: {
          ...currentFeature,
          [permissionKey]: value,
        },
      };
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload =
        roleType === "clerk"
          ? {
              feature_permissions: {
                manage_events: featurePermissions.manage_events || makeDefaultFeaturePermissions(),
              },
            }
          : {
              feature_permissions: {
                manage_users: featurePermissions.manage_users || makeDefaultFeaturePermissions(),
                manage_events: featurePermissions.manage_events || makeDefaultFeaturePermissions(),
                manage_categories:
                  featurePermissions.manage_categories || makeDefaultFeaturePermissions(),
              },
            };

      await adminService.updateUserPermissions(id, payload);
      toast.success("Permissions updated successfully!");

      // If the currently logged-in user updated their own permissions,
      // refresh Redux so tabs/actions reflect the new access immediately.
      if (authUserId != null && String(authUserId) === String(id)) {
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
            <button className="rm-btn rm-btn-secondary" onClick={handleBack} disabled={isSaving}>
              Back
            </button>
            <button className="rm-btn rm-btn-primary" onClick={handleSave} disabled={isSaving}>
              {isSaving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </header>

        <div className="rm-grid">
          {featuresToShow.map((featureKey) => {
            const featureValue = featurePermissions?.[featureKey] || makeDefaultFeaturePermissions();
            return (
              <section key={featureKey} className="rm-feature-card">
                <div className="rm-feature-title">{FEATURE_LABELS[featureKey] || featureKey}</div>
                <div className="rm-permission-list">
                  {PERMISSION_KEYS.map((permissionKey) => (
                    <div key={permissionKey} className="rm-permission-row">
                      <div className="rm-permission-meta">
                        <div className="rm-permission-name">
                          {permissionKey.charAt(0).toUpperCase() + permissionKey.slice(1)}
                        </div>
                        <div className="rm-permission-desc">
                          {PERMISSION_DESCRIPTIONS[permissionKey] || ""}
                        </div>
                      </div>
                      <PermissionSwitch
                        checked={featureValue[permissionKey]}
                        onChange={(v) => handleToggle(featureKey, permissionKey, v)}
                        label={`${FEATURE_LABELS[featureKey] || featureKey} - ${permissionKey}`}
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

