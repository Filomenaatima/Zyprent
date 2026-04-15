"use client";

import "@/styles/profile.css";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/services/api";

type ProfileResponse = {
  id: string;
  name: string | null;
  email: string | null;
  phone: string | null;
  role: "ADMIN" | "MANAGER" | "INVESTOR" | "RESIDENT" | "SERVICE_PROVIDER";
  createdAt: string;
  updatedAt: string;
  walletBalance: number;
  accountBalance: number;
  totalPropertiesHeld: number;
  totalSharesOwned: number;
  kyc: {
    id: string;
    fullName: string;
    nationality: string;
    idType: string;
    status: "PENDING" | "APPROVED" | "REJECTED";
    reviewedAt: string | null;
    createdAt: string;
  } | null;
  residentProfile: {
    id: string;
    status: string;
    unitNumber: string | null;
    propertyTitle: string | null;
    propertyLocation: string | null;
  } | null;
  providerProfile: {
    id: string;
    type: string;
    verificationStatus: string;
    companyName: string | null;
    city: string | null;
    rating: number | null;
    reviewCount: number;
  } | null;
  holdings: {
    propertyId: string;
    propertyTitle: string;
    propertyLocation: string | null;
    sharesOwned: number;
    amountPaid: number;
  }[];
};

function formatCurrency(value: number) {
  return `UGX ${Number(value || 0).toLocaleString()}`;
}

function formatCompactCurrency(value: number) {
  const num = Number(value || 0);

  if (num >= 1_000_000_000) return `UGX ${(num / 1_000_000_000).toFixed(1)}B`;
  if (num >= 1_000_000) return `UGX ${(num / 1_000_000).toFixed(1)}M`;
  if (num >= 1_000) return `UGX ${(num / 1_000).toFixed(0)}K`;

  return `UGX ${num.toLocaleString()}`;
}

function formatDate(value?: string | null) {
  if (!value) return "—";

  return new Date(value).toLocaleDateString("en-UG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatRole(role?: string) {
  if (!role) return "User";

  return role
    .split("_")
    .map((part) => part.charAt(0) + part.slice(1).toLowerCase())
    .join(" ");
}

function getKycTone(status?: string) {
  if (status === "APPROVED") return "approved";
  if (status === "REJECTED") return "rejected";
  return "pending";
}

export default function ProfilePage() {
  const [profile, setProfile] = useState<ProfileResponse | null>(null);
  const [loading, setLoading] = useState(true);

  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    phone: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
  });

  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [profileMessage, setProfileMessage] = useState("");
  const [passwordMessage, setPasswordMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  useEffect(() => {
    let mounted = true;

    async function loadProfile() {
      try {
        setLoading(true);
        const res = await api.get<ProfileResponse>("/users/me/profile");

        if (!mounted) return;

        setProfile(res.data);
        setEditForm({
          name: res.data.name || "",
          email: res.data.email || "",
          phone: res.data.phone || "",
        });
      } catch (error) {
        console.error("Failed to load profile", error);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    loadProfile();

    return () => {
      mounted = false;
    };
  }, []);

  const displayName = useMemo(() => {
    if (profile?.name?.trim()) return profile.name;
    if (profile?.email) return profile.email.split("@")[0];
    return "User";
  }, [profile]);

  const initials = useMemo(() => {
    const text = displayName.trim();

    if (!text.includes(" ")) {
      return text.slice(0, 1).toUpperCase();
    }

    return text
      .split(" ")
      .filter(Boolean)
      .slice(0, 2)
      .map((item) => item[0]?.toUpperCase())
      .join("");
  }, [displayName]);

  async function refreshProfile() {
    const res = await api.get<ProfileResponse>("/users/me/profile");
    setProfile(res.data);
    setEditForm({
      name: res.data.name || "",
      email: res.data.email || "",
      phone: res.data.phone || "",
    });
  }

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSavingProfile(true);
      setProfileMessage("");
      setProfileError("");

      await api.patch("/users/me/profile", editForm);
      await refreshProfile();

      setProfileMessage("Profile updated successfully.");
    } catch (error: any) {
      console.error("Failed to update profile", error);
      setProfileError(
        error?.response?.data?.message || "Failed to update profile.",
      );
    } finally {
      setSavingProfile(false);
    }
  }

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();

    try {
      setSavingPassword(true);
      setPasswordMessage("");
      setPasswordError("");

      await api.patch("/users/me/password", passwordForm);

      setPasswordForm({
        currentPassword: "",
        newPassword: "",
      });

      setPasswordMessage("Password changed successfully.");
    } catch (error: any) {
      console.error("Failed to change password", error);

      const message = error?.response?.data?.message;
      setPasswordError(
        Array.isArray(message) ? message.join(", ") : message || "Failed to change password.",
      );
    } finally {
      setSavingPassword(false);
    }
  }

  return (
    <div className="profile-shell">
      <section className="profile-hero">
        <div className="profile-hero-copy">
          <p className="profile-eyebrow">Account Profile</p>
          <h1 className="profile-title">Manage identity, verification, and account settings</h1>
          <p className="profile-text">
            Review your personal details, KYC status, holdings summary, account
            balances, and security settings from one secure workspace.
          </p>

          <div className="profile-tags">
            <span className="profile-tag">Live account details</span>
            <span className="profile-tag">KYC visibility</span>
            <span className="profile-tag">Security controls</span>
            <span className="profile-tag">Portfolio-linked profile</span>
          </div>
        </div>

        <div className="profile-hero-side">
          <div className="profile-identity-card dark">
            <div className="profile-avatar">{initials}</div>
            <div className="profile-identity-copy">
              <p>{formatRole(profile?.role)}</p>
              <h3>{displayName}</h3>
              <span>{profile?.email || "No email"}</span>
            </div>
          </div>

          <div className="profile-hero-stats">
            <div className="profile-stat-card">
              <span>Wallet Balance</span>
              <strong>{formatCompactCurrency(profile?.walletBalance ?? 0)}</strong>
            </div>
            <div className="profile-stat-card">
              <span>Account Balance</span>
              <strong>{formatCompactCurrency(profile?.accountBalance ?? 0)}</strong>
            </div>
            <div className="profile-stat-card">
              <span>Properties Held</span>
              <strong>{profile?.totalPropertiesHeld ?? 0}</strong>
            </div>
            <div className="profile-stat-card">
              <span>Total Shares</span>
              <strong>{profile?.totalSharesOwned ?? 0}</strong>
            </div>
          </div>
        </div>
      </section>

      <section className="profile-grid-two">
        <div className="profile-section">
          <div className="profile-section-head">
            <div>
              <h2 className="profile-section-title">Personal Details</h2>
              <p className="profile-section-subtitle">
                Update the main contact details tied to your account
              </p>
            </div>
            <span className="profile-chip">Live</span>
          </div>

          {loading ? (
            <div className="profile-empty">Loading profile...</div>
          ) : (
            <form className="profile-form" onSubmit={handleSaveProfile}>
              <div className="profile-form-grid">
                <label className="profile-field">
                  <span>Full Name</span>
                  <input
                    value={editForm.name}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, name: e.target.value }))
                    }
                    placeholder="Enter full name"
                  />
                </label>

                <label className="profile-field">
                  <span>Email Address</span>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, email: e.target.value }))
                    }
                    placeholder="Enter email"
                  />
                </label>

                <label className="profile-field">
                  <span>Phone Number</span>
                  <input
                    value={editForm.phone}
                    onChange={(e) =>
                      setEditForm((prev) => ({ ...prev, phone: e.target.value }))
                    }
                    placeholder="Enter phone number"
                  />
                </label>

                <div className="profile-info-card">
                  <span>Member Since</span>
                  <strong>{formatDate(profile?.createdAt)}</strong>
                  <small>Last updated {formatDate(profile?.updatedAt)}</small>
                </div>
              </div>

              {profileMessage ? (
                <div className="profile-message success">{profileMessage}</div>
              ) : null}

              {profileError ? (
                <div className="profile-message error">{profileError}</div>
              ) : null}

              <div className="profile-actions">
                <button type="submit" className="profile-primary-btn" disabled={savingProfile}>
                  {savingProfile ? "Saving..." : "Save Profile"}
                </button>
              </div>
            </form>
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-head">
            <div>
              <h2 className="profile-section-title">Security</h2>
              <p className="profile-section-subtitle">
                Change your password and protect account access
              </p>
            </div>
            <span className="profile-chip">Protected</span>
          </div>

          {loading ? (
            <div className="profile-empty">Loading security...</div>
          ) : (
            <form className="profile-form" onSubmit={handleChangePassword}>
              <div className="profile-form-grid single">
                <label className="profile-field">
                  <span>Current Password</span>
                  <input
                    type="password"
                    value={passwordForm.currentPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        currentPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter current password"
                  />
                </label>

                <label className="profile-field">
                  <span>New Password</span>
                  <input
                    type="password"
                    value={passwordForm.newPassword}
                    onChange={(e) =>
                      setPasswordForm((prev) => ({
                        ...prev,
                        newPassword: e.target.value,
                      }))
                    }
                    placeholder="Enter new password"
                  />
                </label>
              </div>

              {passwordMessage ? (
                <div className="profile-message success">{passwordMessage}</div>
              ) : null}

              {passwordError ? (
                <div className="profile-message error">{passwordError}</div>
              ) : null}

              <div className="profile-actions">
                <button
                  type="submit"
                  className="profile-primary-btn"
                  disabled={savingPassword}
                >
                  {savingPassword ? "Updating..." : "Change Password"}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>

      <section className="profile-grid-two">
        <div className="profile-section">
          <div className="profile-section-head">
            <div>
              <h2 className="profile-section-title">Verification Status</h2>
              <p className="profile-section-subtitle">
                Your KYC and account verification snapshot
              </p>
            </div>
            <span className={`profile-chip ${getKycTone(profile?.kyc?.status)}`}>
              {profile?.kyc?.status || "No KYC"}
            </span>
          </div>

          {!profile?.kyc ? (
            <div className="profile-empty">
              No KYC record found.
              <br />
              <span>Your verification status will appear here once submitted.</span>
            </div>
          ) : (
            <div className="profile-kyc-card">
              <div className="profile-kyc-grid">
                <div className="profile-data-card">
                  <span>Full Name</span>
                  <strong>{profile.kyc.fullName}</strong>
                </div>
                <div className="profile-data-card">
                  <span>Nationality</span>
                  <strong>{profile.kyc.nationality}</strong>
                </div>
                <div className="profile-data-card">
                  <span>ID Type</span>
                  <strong>{profile.kyc.idType}</strong>
                </div>
                <div className="profile-data-card">
                  <span>Status</span>
                  <strong>{profile.kyc.status}</strong>
                </div>
                <div className="profile-data-card">
                  <span>Submitted</span>
                  <strong>{formatDate(profile.kyc.createdAt)}</strong>
                </div>
                <div className="profile-data-card">
                  <span>Reviewed</span>
                  <strong>{formatDate(profile.kyc.reviewedAt)}</strong>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="profile-section">
          <div className="profile-section-head">
            <div>
              <h2 className="profile-section-title">Role Snapshot</h2>
              <p className="profile-section-subtitle">
                Account context based on your current platform role
              </p>
            </div>
            <span className="profile-chip">{formatRole(profile?.role)}</span>
          </div>

          <div className="profile-role-stack">
            <div className="profile-role-card">
              <span>Current Role</span>
              <strong>{formatRole(profile?.role)}</strong>
            </div>

            {profile?.residentProfile ? (
              <div className="profile-role-card">
                <span>Resident Unit</span>
                <strong>{profile.residentProfile.unitNumber || "—"}</strong>
                <small>
                  {profile.residentProfile.propertyTitle || "No property"} •{" "}
                  {profile.residentProfile.propertyLocation || "No location"}
                </small>
              </div>
            ) : null}

            {profile?.providerProfile ? (
              <div className="profile-role-card">
                <span>Provider Status</span>
                <strong>{profile.providerProfile.verificationStatus}</strong>
                <small>
                  {profile.providerProfile.companyName || "No company"} •{" "}
                  {profile.providerProfile.city || "No city"}
                </small>
              </div>
            ) : null}

            {!profile?.residentProfile && !profile?.providerProfile ? (
              <div className="profile-role-card">
                <span>Investor Summary</span>
                <strong>{profile?.totalPropertiesHeld ?? 0} properties linked</strong>
                <small>{profile?.totalSharesOwned ?? 0} total shares owned</small>
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="profile-section">
        <div className="profile-section-head">
          <div>
            <h2 className="profile-section-title">Holdings Overview</h2>
            <p className="profile-section-subtitle">
              Properties connected to your investor identity
            </p>
          </div>
          <span className="profile-chip">
            {profile?.holdings.length ?? 0} Holdings
          </span>
        </div>

        {loading ? (
          <div className="profile-empty">Loading holdings...</div>
        ) : !profile?.holdings.length ? (
          <div className="profile-empty">
            No holdings found.
            <br />
            <span>Your property-linked investor positions will appear here.</span>
          </div>
        ) : (
          <div className="profile-holdings-grid">
            {profile.holdings.map((item) => (
              <div key={item.propertyId} className="profile-holding-card">
                <div className="profile-holding-top">
                  <div>
                    <h3>{item.propertyTitle}</h3>
                    <p>{item.propertyLocation || "No location"}</p>
                  </div>
                  <span className="profile-holding-badge">{item.sharesOwned} shares</span>
                </div>

                <div className="profile-holding-metrics">
                  <div className="profile-data-card">
                    <span>Capital Deployed</span>
                    <strong>{formatCurrency(item.amountPaid)}</strong>
                  </div>
                  <div className="profile-data-card">
                    <span>Shares Owned</span>
                    <strong>{item.sharesOwned}</strong>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}