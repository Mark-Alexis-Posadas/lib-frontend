import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";
import type { User } from "../../shared/types";

export function SettingsPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["settings"],
        queryFn: () => api.get("/settings"),
    });
    const client = useQueryClient();
    const library = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            api.put("/settings/library", values),
        onSuccess: () => client.invalidateQueries({ queryKey: ["settings"] }),
    });
    const borrowing = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            api.put("/settings/borrowing", values),
        onSuccess: () => client.invalidateQueries({ queryKey: ["settings"] }),
    });
    const { user } = useOutletContext<{ user: User }>();
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const settings = data.data;
    return (
        <>
            <PageTitle
                title="Settings"
                description="Manage your library configuration."
            />
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="h-fit p-3">
                    <a
                        href="#library"
                        className="block rounded-lg bg-indigo-50 px-4 py-3 text-sm font-medium text-indigo-700"
                    >
                        🏛️ Library Information
                    </a>
                    <a
                        href="#borrowing"
                        className="mt-1 block rounded-lg px-4 py-3 text-sm hover:bg-gray-50"
                    >
                        📖 Borrowing Rules
                    </a>
                    <a
                        href="#account"
                        className="mt-1 block rounded-lg px-4 py-3 text-sm hover:bg-gray-50"
                    >
                        👤 Account
                    </a>
                </Card>
                <div className="space-y-6 lg:col-span-2">
                    <Card className="p-6" id="library">
                        <h2 className="font-semibold">Library Information</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Basic information about your library.
                        </p>
                        <div className="mt-5">
                            <RecordForm
                                fields={[
                                    {
                                        name: "library_name",
                                        label: "Library Name",
                                        required: true,
                                    },
                                    { name: "address", label: "Address" },
                                    { name: "phone", label: "Contact Number" },
                                    {
                                        name: "email",
                                        label: "Email",
                                        type: "email",
                                    },
                                ]}
                                initial={settings}
                                submitLabel={
                                    library.isPending
                                        ? "Saving..."
                                        : "Save Changes"
                                }
                                cancelTo="/settings"
                                onSubmit={(values) =>
                                    library.mutateAsync(values)
                                }
                            />
                        </div>
                    </Card>
                    <Card className="p-6" id="borrowing">
                        <h2 className="font-semibold">Borrowing Rules</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Configure borrowing and overdue policies.
                        </p>
                        <div className="mt-5">
                            <RecordForm
                                fields={[
                                    {
                                        name: "max_books",
                                        label: "Maximum Books",
                                        type: "number",
                                        min: 1,
                                        required: true,
                                    },
                                    {
                                        name: "borrow_days",
                                        label: "Borrow Duration (Days)",
                                        type: "number",
                                        min: 1,
                                        required: true,
                                    },
                                    {
                                        name: "fine_per_day",
                                        label: "Fine Per Day",
                                        type: "number",
                                        min: 0,
                                        step: ".01",
                                        required: true,
                                    },
                                ]}
                                initial={settings}
                                submitLabel="Save Rules"
                                cancelTo="/settings"
                                onSubmit={(values) =>
                                    borrowing.mutateAsync(values)
                                }
                            />
                        </div>
                    </Card>
                    <Card className="p-6" id="account">
                        <h2 className="font-semibold">Account</h2>
                        <p className="mt-1 text-sm text-gray-500">
                            Update your administrator account.
                        </p>
                        <div className="mt-5 space-y-4">
                            <Info label="Name" value={user?.name} />
                            <Info label="Email" value={user?.email} />
                        </div>
                        <NavLink
                            to="/profile"
                            className={`${secondaryButtonClass} mt-5`}
                        >
                            Manage Account
                        </NavLink>
                    </Card>
                </div>
            </div>
        </>
    );
}
