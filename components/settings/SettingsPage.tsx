"use client";

import { LoaderCircle, LockKeyhole, Upload, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import toast from "react-hot-toast";
import { ProtectedShell } from "@/components/layout/ProtectedShell";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { Input, Textarea } from "@/components/ui/Input";
import { apiClient } from "@/lib/client-api";
import type { SafeUser } from "@/lib/types";
import { useAuthStore } from "@/stores/useAuthStore";

type ProfileFormState = {
  username: string;
  displayName: string;
  bio: string;
  profilePic: string;
};

type PasswordFormState = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};

function buildProfileForm(user: SafeUser): ProfileFormState {
  return {
    username: user.username,
    displayName: user.displayName ?? "",
    bio: user.bio ?? "",
    profilePic: user.profilePic ?? "",
  };
}

export default function SettingsPage() {
  const hydrated = useAuthStore((state) => state.hydrated);
  const storedUser = useAuthStore((state) => state.user);
  const updateUser = useAuthStore((state) => state.updateUser);
  const fileRef = useRef<HTMLInputElement>(null);
  const loadedUserIdRef = useRef<string | null>(null);
  const [currentUser, setCurrentUser] = useState<SafeUser | null>(storedUser);
  const [loadingProfile, setLoadingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [profileForm, setProfileForm] = useState<ProfileFormState>({
    username: "",
    displayName: "",
    bio: "",
    profilePic: "",
  });
  const [passwordForm, setPasswordForm] = useState<PasswordFormState>({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  async function loadUser() {
    setLoadingProfile(true);

    try {
      const data = await apiClient.get<{ success: true; user: SafeUser }>("/api/auth/me");
      setCurrentUser(data.user);
      setProfileForm(buildProfileForm(data.user));
      updateUser(data.user);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to load your settings");
    } finally {
      setLoadingProfile(false);
    }
  }

  useEffect(() => {
    if (!hydrated || !storedUser) {
      loadedUserIdRef.current = null;
      return;
    }

    setCurrentUser(storedUser);

    if (loadedUserIdRef.current === storedUser.id) {
      return;
    }

    loadedUserIdRef.current = storedUser.id;
    setProfileForm(buildProfileForm(storedUser));
    void loadUser();
  }, [hydrated, storedUser]);

  async function handleProfileSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSavingProfile(true);

    try {
      await apiClient.put("/api/users/profile", {
        username: profileForm.username.trim(),
        displayName: profileForm.displayName.trim(),
        bio: profileForm.bio.trim(),
        profilePic: profileForm.profilePic.trim(),
      });
      await loadUser();
      toast.success("Profile updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to update profile");
    } finally {
      setSavingProfile(false);
    }
  }

  async function handlePasswordSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      toast.error("New passwords do not match");
      return;
    }

    setChangingPassword(true);

    try {
      const data = await apiClient.put<{ success: true; message: string }>("/api/users/change-password", {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      toast.success(data.message);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to change password");
    } finally {
      setChangingPassword(false);
    }
  }

  async function uploadProfileImage(file: File) {
    setUploadingImage(true);

    try {
      const formData = new FormData();
      formData.set("file", file);
      formData.set("purpose", "profile_image");
      const upload = await apiClient.post<{ success: true; url: string }>("/api/upload", formData);
      setProfileForm((state) => ({ ...state, profilePic: upload.url }));
      toast.success("Profile photo ready to save");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Unable to upload profile photo");
    } finally {
      if (fileRef.current) {
        fileRef.current.value = "";
      }
      setUploadingImage(false);
    }
  }

  const previewName = profileForm.displayName.trim() || profileForm.username.trim() || "ChatSphere User";
  const email = currentUser?.email ?? storedUser?.email ?? "";

  return (
    <ProtectedShell title="Settings">
      <div className="grid gap-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-6">
        <section className="rounded-[1.5rem] bg-white p-4 sm:p-5 lg:p-6">
          <div className="flex items-start gap-3">
            <div className="gradient-brand flex h-12 w-12 items-center justify-center rounded-2xl text-white">
              <UserRound size={20} />
            </div>
            <div className="min-w-0">
              <p className="font-display text-lg font-semibold sm:text-xl">Profile details</p>
              <p className="text-sm text-[var(--muted)] sm:text-base">
                Update how your name and photo appear across ChatSphere.
              </p>
            </div>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleProfileSubmit}>
            <div className="flex flex-col gap-4 rounded-[1.5rem] bg-[var(--background-soft)] p-4 sm:flex-row sm:items-center">
              <Avatar
                name={previewName}
                src={profileForm.profilePic}
                size="xl"
                className="h-20 w-20 shrink-0"
              />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{previewName}</p>
                <p className="truncate text-sm text-[var(--muted)]">@{profileForm.username || "username"}</p>
                <p className="mt-1 text-xs text-[var(--muted)] sm:text-sm">
                  PNG, JPG, GIF, or WEBP up to 5MB.
                </p>
              </div>
              <Button
                type="button"
                variant="secondary"
                className="justify-center sm:self-center"
                disabled={uploadingImage}
                onClick={() => fileRef.current?.click()}
              >
                {uploadingImage ? <LoaderCircle className="animate-spin" size={18} /> : <Upload size={18} />}
                {uploadingImage ? "Uploading..." : "Upload photo"}
              </Button>
              <input
                ref={fileRef}
                type="file"
                className="hidden"
                accept="image/png,image/jpeg,image/gif,image/webp"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) {
                    void uploadProfileImage(file);
                  }
                }}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium">Display name</span>
                <Input
                  placeholder="How your friends see you"
                  value={profileForm.displayName}
                  onChange={(event) =>
                    setProfileForm((state) => ({ ...state, displayName: event.target.value }))
                  }
                  maxLength={50}
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium">Username</span>
                <Input
                  placeholder="username"
                  value={profileForm.username}
                  onChange={(event) =>
                    setProfileForm((state) => ({ ...state, username: event.target.value }))
                  }
                  maxLength={20}
                  required
                />
              </label>
            </div>

            <label className="space-y-2">
              <span className="text-sm font-medium">Email address</span>
              <Input value={email} disabled />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium">Bio</span>
              <Textarea
                placeholder="Tell your circle a little about yourself"
                value={profileForm.bio}
                onChange={(event) => setProfileForm((state) => ({ ...state, bio: event.target.value }))}
                rows={4}
                maxLength={160}
              />
              <p className="text-right text-xs text-[var(--muted)]">{profileForm.bio.length}/160</p>
            </label>

            <div className="flex justify-end">
              <Button className="justify-center" disabled={savingProfile || loadingProfile} type="submit">
                {savingProfile ? <LoaderCircle className="animate-spin" size={18} /> : null}
                Save profile
              </Button>
            </div>
          </form>
        </section>

        <section className="space-y-4">
          <div className="rounded-[1.5rem] bg-white p-4 sm:p-5 lg:p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-2xl bg-[var(--brand-soft)] p-3 text-[var(--brand)]">
                <LockKeyhole size={20} />
              </div>
              <div className="min-w-0">
                <p className="font-display text-lg font-semibold sm:text-xl">Password & security</p>
                <p className="text-sm text-[var(--muted)] sm:text-base">
                  Keep your account secure with a fresh password.
                </p>
              </div>
            </div>

            <form className="mt-6 space-y-4" onSubmit={handlePasswordSubmit}>
              <label className="space-y-2">
                <span className="text-sm font-medium">Current password</span>
                <Input
                  type="password"
                  placeholder="Current password"
                  value={passwordForm.currentPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({ ...state, currentPassword: event.target.value }))
                  }
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">New password</span>
                <Input
                  type="password"
                  placeholder="At least 8 characters"
                  value={passwordForm.newPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({ ...state, newPassword: event.target.value }))
                  }
                  minLength={8}
                  required
                />
              </label>

              <label className="space-y-2">
                <span className="text-sm font-medium">Confirm new password</span>
                <Input
                  type="password"
                  placeholder="Re-enter your new password"
                  value={passwordForm.confirmPassword}
                  onChange={(event) =>
                    setPasswordForm((state) => ({ ...state, confirmPassword: event.target.value }))
                  }
                  minLength={8}
                  required
                />
              </label>

              <div className="flex justify-end">
                <Button className="justify-center" disabled={changingPassword} type="submit">
                  {changingPassword ? <LoaderCircle className="animate-spin" size={18} /> : null}
                  Update password
                </Button>
              </div>
            </form>
          </div>

          <div className="rounded-[1.5rem] bg-white p-4 sm:p-5">
            <p className="font-display text-base font-semibold sm:text-lg">Account snapshot</p>
            <div className="mt-4 space-y-3 text-sm sm:text-base">
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--background-soft)] px-4 py-3">
                <span className="text-[var(--muted)]">Verification</span>
                <span className="font-medium">
                  {(currentUser ?? storedUser)?.isVerified ? "Verified" : "Pending"}
                </span>
              </div>
              <div className="flex items-center justify-between gap-3 rounded-2xl bg-[var(--background-soft)] px-4 py-3">
                <span className="text-[var(--muted)]">Status</span>
                <span className="font-medium">
                  {(currentUser ?? storedUser)?.isOnline ? "Online" : "Offline"}
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>
    </ProtectedShell>
  );
}
