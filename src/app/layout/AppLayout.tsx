import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";
import type { User } from "../../shared/types";

export const navItems = [
    ["/", "📊", "Dashboard"],
    ["/books", "📚", "Books"],
    ["/members", "👥", "Members"],
    ["/borrowings", "📖", "Borrowings"],
    ["/returns", "🔄", "Returns"],
    ["/categories", "🏷️", "Categories"],
    ["/reports", "📈", "Reports"],
    ["/settings", "⚙️", "Settings"],
];

export function AppLayout() {
    const { user: actualUser } = useOutletContext<{ user: User }>();
    const [menuOpen, setMenuOpen] = useState(false);
    const [logoutError, setLogoutError] = useState(null);
    const darkMode = useUiStore((state) => state.darkMode);
    const toggleDarkMode = useUiStore((state) => state.toggleDarkMode);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const navigate = useNavigate();
    const client = useQueryClient();
    const logout = useMutation({
        mutationFn: () => api.post("/logout"),
        onSuccess: () => {
            setLogoutError(null);
            clearAuth();
            client.clear();
            navigate("/login", { replace: true });
        },
        onError: (error) => {
            if (error instanceof ApiError && error.status === 401) {
                clearAuth();
                client.clear();
                navigate("/login", { replace: true });
                return;
            }

            setLogoutError(error);
        },
    });

    return (
        <div className="min-h-screen">
            <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900 lg:block">
                <div className="flex h-16 items-center gap-3 border-b border-gray-200 px-6 dark:border-gray-800">
                    <div className="grid h-9 w-9 place-items-center rounded-lg bg-indigo-600 text-white">
                        📚
                    </div>
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                        Library
                    </span>
                </div>
                <nav className="space-y-1 p-4">
                    {navItems.map(([to, icon, label], index) => (
                        <React.Fragment key={to}>
                            {index === 6 && (
                                <div className="my-4 border-t border-gray-200 dark:border-gray-800" />
                            )}
                            <NavLink
                                to={to}
                                end={to === "/"}
                                className={({ isActive }) =>
                                    `flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium transition ${isActive ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300" : "text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"}`
                                }
                            >
                                <span>{icon}</span>
                                {label}
                            </NavLink>
                        </React.Fragment>
                    ))}
                </nav>
            </aside>

            <div className="lg:pl-64">
                <header className="sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur dark:border-gray-800 dark:bg-gray-900/95">
                    <div className="flex min-h-16 items-center justify-between gap-4 px-4 sm:px-6">
                        <nav className="flex gap-3 overflow-x-auto lg:hidden">
                            {navItems.map(([to, icon, label]) => (
                                <NavLink
                                    key={to}
                                    to={to}
                                    end={to === "/"}
                                    className={({ isActive }) =>
                                        `shrink-0 rounded-lg px-2 py-2 text-sm ${isActive ? "text-indigo-700" : "text-gray-600 dark:text-gray-300"}`
                                    }
                                >
                                    <span aria-hidden="true">{icon} </span>
                                    {label}
                                </NavLink>
                            ))}
                        </nav>
                        <div className="hidden text-lg font-semibold text-gray-900 dark:text-white lg:block">
                            Library Management System
                        </div>
                        <div className="ml-auto flex items-center gap-3">
                            <button
                                type="button"
                                onClick={toggleDarkMode}
                                className={secondaryButtonClass}
                                aria-label="Toggle dark mode"
                            >
                                {darkMode ? "☀️" : "🌙"}
                            </button>
                            <div className="relative">
                                <button
                                    type="button"
                                    onClick={() => setMenuOpen(!menuOpen)}
                                    className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-100 dark:hover:bg-gray-800"
                                >
                                    <Avatar user={actualUser} />
                                    <span className="hidden text-left sm:block">
                                        <span className="block text-sm font-semibold text-gray-900 dark:text-gray-100">
                                            {actualUser?.name}
                                        </span>
                                        <span className="block text-xs text-gray-500">
                                            {actualUser?.email}
                                        </span>
                                    </span>
                                </button>
                                {menuOpen && (
                                    <div className="absolute right-0 top-full z-40 mt-2 w-48 rounded-xl border border-gray-200 bg-white p-2 shadow-lg dark:border-gray-800 dark:bg-gray-900">
                                        <NavLink
                                            onClick={() => setMenuOpen(false)}
                                            to="/profile"
                                            className="block rounded-lg px-3 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-800"
                                        >
                                            Profile
                                        </NavLink>
                                        <button
                                            type="button"
                                            onClick={() => logout.mutate()}
                                            className="w-full rounded-lg px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                                        >
                                            Sign out
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>
                <main className="p-4 sm:p-6">
                    {logoutError && (
                        <Alert>{`Could not sign out: ${messageFrom(logoutError)}`}</Alert>
                    )}
                    <Outlet context={{ user: actualUser }} />
                </main>
            </div>
        </div>
    );
}
