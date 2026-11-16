import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";
import type { User } from "../../shared/types";

export function ProfilePage() {
    const { user } = useOutletContext<{ user: User }>();
    const client = useQueryClient();
    const [profileError, setProfileError] = useState<unknown>(null);
    const [profileMessage, setProfileMessage] = useState("");
    const [passwordError, setPasswordError] = useState<unknown>(null);
    const [passwordMessage, setPasswordMessage] = useState("");
    const profile = useMutation({
        mutationFn: (formData: FormData) => api.post("/profile", formData),
        onSuccess: (result) => {
            useAuthStore
                .getState()
                .setAuth(useAuthStore.getState().token, result.data);
            client.setQueryData(["me", useAuthStore.getState().token], {
                data: result.data,
            });
            setProfileMessage(result.message);
            setProfileError(null);
        },
        onError: setProfileError,
    });
    const password = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            api.put("/profile/password", values),
        onSuccess: (result) => {
            setPasswordMessage(result.message);
            setPasswordError(null);
        },
        onError: setPasswordError,
    });

    function submitProfile(event) {
        event.preventDefault();
        setProfileMessage("");
        profile.mutate(new FormData(event.currentTarget));
    }

    function submitPassword(event) {
        event.preventDefault();
        setPasswordMessage("");
        const form = event.currentTarget;
        const values = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
        );
        password.mutate(values, { onSuccess: () => form.reset() });
    }

    return (
        <>
            <PageTitle
                title="My Profile"
                description="Manage your account information and password."
            />
            {profileMessage && <Alert tone="success">{profileMessage}</Alert>}
            {profileError && <LoadError error={profileError} />}
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="flex flex-col items-center p-6 text-center">
                    <Avatar user={user} size="h-24 w-24 text-3xl" />
                    <h2 className="mt-4 text-lg font-semibold">{user?.name}</h2>
                    <p className="mt-1 break-all text-sm text-gray-500">
                        {user?.email}
                    </p>
                    <span className="mt-5 rounded-full bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700">
                        Active Account
                    </span>
                </Card>
                <Card className="overflow-hidden lg:col-span-2">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <h2 className="font-semibold">Profile Information</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your profile photo, name, and email address.
                        </p>
                    </div>
                    <form onSubmit={submitProfile}>
                        <div className="space-y-5 px-6 py-6">
                            <label className="block text-sm font-medium">
                                Profile Image
                                <input
                                    className={inputClass}
                                    type="file"
                                    name="profile_image"
                                    accept="image/jpeg,image/png,image/webp"
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Full Name
                                <input
                                    className={inputClass}
                                    name="name"
                                    required
                                    defaultValue={user?.name}
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Email Address
                                <input
                                    className={inputClass}
                                    name="email"
                                    type="email"
                                    required
                                    defaultValue={user?.email}
                                />
                            </label>
                        </div>
                        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                            <button
                                className={buttonClass}
                                disabled={profile.isPending}
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </Card>
                <Card className="overflow-hidden lg:col-span-3">
                    <div className="border-b border-gray-200 px-6 py-5">
                        <h2 className="font-semibold">Change Password</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Make sure your new password is at least 8
                            characters.
                        </p>
                    </div>
                    {passwordMessage && (
                        <div className="p-6 pb-0">
                            <Alert tone="success">{passwordMessage}</Alert>
                        </div>
                    )}
                    {passwordError && (
                        <div className="p-6 pb-0">
                            <LoadError error={passwordError} />
                        </div>
                    )}
                    <form onSubmit={submitPassword}>
                        <div className="grid gap-5 px-6 py-6 md:grid-cols-3">
                            <label className="block text-sm font-medium">
                                Current Password
                                <input
                                    className={inputClass}
                                    type="password"
                                    name="current_password"
                                    required
                                    autoComplete="current-password"
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                New Password
                                <input
                                    className={inputClass}
                                    type="password"
                                    name="password"
                                    required
                                    autoComplete="new-password"
                                />
                            </label>
                            <label className="block text-sm font-medium">
                                Confirm New Password
                                <input
                                    className={inputClass}
                                    type="password"
                                    name="password_confirmation"
                                    required
                                    autoComplete="new-password"
                                />
                            </label>
                        </div>
                        <div className="flex justify-end border-t border-gray-200 px-6 py-4">
                            <button
                                className={buttonClass}
                                disabled={password.isPending}
                            >
                                Update Password
                            </button>
                        </div>
                    </form>
                </Card>
            </div>
        </>
    );
}
