"use client";

import { useState } from "react";
import { useAuth } from "@/context/AuthContext";
import * as authService from "@/services/auth";
import { Loader2 } from "lucide-react";

export default function ClientSettingsPage() {
  const { user, refreshUser } = useAuth();

  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    company: "",
    bio: "",
  });
  const [syncedUser, setSyncedUser] = useState<typeof user>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState("");
  const [profileError, setProfileError] = useState("");

  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [savingPassword, setSavingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState("");
  const [passwordError, setPasswordError] = useState("");

  if (user && user !== syncedUser) {
    setSyncedUser(user);
    setProfileForm({
      name: user.name || "",
      phone: user.phone || "",
      company: user.company || "",
      bio: user.bio || "",
    });
  }

  const handleProfileSave = async () => {
    setSavingProfile(true);
    setProfileSuccess("");
    setProfileError("");
    try {
      await authService.updateProfile({
        name: profileForm.name,
        phone: profileForm.phone,
        company: profileForm.company,
        bio: profileForm.bio,
      });
      await refreshUser();
      setProfileSuccess("Profile updated successfully");
    } catch {
      setProfileError("Failed to update profile");
    } finally {
      setSavingProfile(false);
    }
  };

  const handlePasswordChange = async () => {
    setPasswordSuccess("");
    setPasswordError("");
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match");
      return;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must be at least 8 characters");
      return;
    }
    setSavingPassword(true);
    try {
      await authService.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordSuccess("Password changed successfully");
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      setPasswordError("Failed to change password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="mt-1 text-sm text-neutral-500">
          Manage your account settings
        </p>
      </div>

      <div className="card p-6 ">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Profile Information
        </h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">Name</label>
            <input
              className="input"
              value={profileForm.name}
              onChange={(e) =>
                setProfileForm({ ...profileForm, name: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Email</label>
            <input className="input" value={user?.email ?? ""} disabled />
          </div>
          <div>
            <label className="form-label">Phone</label>
            <input
              className="input"
              value={profileForm.phone}
              onChange={(e) =>
                setProfileForm({ ...profileForm, phone: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Company</label>
            <input
              className="input"
              value={profileForm.company}
              onChange={(e) =>
                setProfileForm({ ...profileForm, company: e.target.value })
              }
            />
          </div>
          <div>
            <label className="form-label">Bio</label>
            <textarea
              className="input"
              rows={3}
              value={profileForm.bio}
              onChange={(e) =>
                setProfileForm({ ...profileForm, bio: e.target.value })
              }
            />
          </div>
        </div>
        {profileSuccess && (
          <div className="form-alert form-alert-success mt-4">
            {profileSuccess}
          </div>
        )}
        {profileError && (
          <div className="form-alert form-alert-error mt-4">{profileError}</div>
        )}
        <div className="flex justify-end mt-6">
          <button
            className="btn btn-primary btn-md"
            disabled={savingProfile}
            onClick={handleProfileSave}
          >
            {savingProfile ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Save Changes
          </button>
        </div>
      </div>

      <div className="card p-6 ">
        <h2 className="text-lg font-bold text-foreground mb-4">
          Change Password
        </h2>
        <div className="space-y-4">
          <div>
            <label className="form-label">Current Password</label>
            <input
              className="input"
              type="password"
              value={passwordForm.currentPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  currentPassword: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="form-label">New Password</label>
            <input
              className="input"
              type="password"
              value={passwordForm.newPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  newPassword: e.target.value,
                })
              }
            />
          </div>
          <div>
            <label className="form-label">Confirm New Password</label>
            <input
              className="input"
              type="password"
              value={passwordForm.confirmPassword}
              onChange={(e) =>
                setPasswordForm({
                  ...passwordForm,
                  confirmPassword: e.target.value,
                })
              }
            />
          </div>
        </div>
        {passwordSuccess && (
          <div className="form-alert form-alert-success mt-4">
            {passwordSuccess}
          </div>
        )}
        {passwordError && (
          <div className="form-alert form-alert-error mt-4">
            {passwordError}
          </div>
        )}
        <div className="flex justify-end mt-6">
          <button
            className="btn btn-primary btn-md"
            disabled={savingPassword}
            onClick={handlePasswordChange}
          >
            {savingPassword ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : null}
            Change Password
          </button>
        </div>
      </div>
    </div>
  );
}
