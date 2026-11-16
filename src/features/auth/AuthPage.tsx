import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function AuthPage({ mode }: { mode: "login" | "register" }) {
    const isRegister = mode === "register";
    const [error, setError] = useState<unknown>(null);
    const [saving, setSaving] = useState(false);
    const navigate = useNavigate();
    const token = useAuthStore((state) => state.token);
    const setAuth = useAuthStore((state) => state.setAuth);
    const client = useQueryClient();

    if (token) return <Navigate to="/" replace />;

    async function submit(event) {
        event.preventDefault();
        setError(null);
        setSaving(true);
        const formData = new FormData(event.currentTarget);
        if (!isRegister) formData.delete("password_confirmation");

        try {
            const result = await api.post(
                isRegister ? "/register" : "/login",
                isRegister ? formData : Object.fromEntries(formData.entries()),
            );
            setAuth(result.token, result.user);
            client.setQueryData(["me", result.token], { data: result.user });
            navigate("/", { replace: true });
        } catch (requestError) {
            setError(requestError);
        } finally {
            setSaving(false);
        }
    }

    return (
        <main className="grid min-h-screen place-items-center bg-gray-100 px-4 py-8 dark:bg-gray-950">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-xl bg-indigo-600 text-xl font-bold text-white">
                        L
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                        Library Management System
                    </h1>
                    <p className="mt-2 text-sm text-gray-500">
                        {isRegister
                            ? "Create your account"
                            : "Sign in to your account"}
                    </p>
                </div>
                <Card className="p-6 sm:p-8">
                    <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                        {isRegister ? "Register" : "Welcome Back"}
                    </h2>
                    <p className="mt-1 text-sm text-gray-500">
                        {isRegister
                            ? "Fill in your details to get started."
                            : "Enter your credentials to continue."}
                    </p>
                    {error && (
                        <div className="mt-5">
                            <Alert>
                                {messageFrom(error)}
                                {error instanceof ApiError && (
                                    <ul className="mt-2 list-disc pl-5">
                                        {Object.values(error.errors)
                                            .flat()
                                            .map((item) => (
                                                <li key={item}>{item}</li>
                                            ))}
                                    </ul>
                                )}
                            </Alert>
                        </div>
                    )}
                    <form onSubmit={submit} className="mt-6 space-y-5">
                        {isRegister && (
                            <Field
                                field={{
                                    name: "name",
                                    label: "Full Name",
                                    required: true,
                                }}
                            />
                        )}
                        <Field
                            field={{
                                name: "email",
                                label: "Email Address",
                                type: "email",
                                required: true,
                            }}
                        />
                        {isRegister && (
                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                                Profile Image
                                <input
                                    className={inputClass}
                                    name="profile_image"
                                    type="file"
                                    accept="image/jpeg,image/png,image/webp"
                                />
                            </label>
                        )}
                        <Field
                            field={{
                                name: "password",
                                label: "Password",
                                type: "password",
                                required: true,
                            }}
                        />
                        {isRegister && (
                            <Field
                                field={{
                                    name: "password_confirmation",
                                    label: "Confirm Password",
                                    type: "password",
                                    required: true,
                                }}
                            />
                        )}
                        <button
                            className={`${buttonClass} w-full`}
                            disabled={saving}
                        >
                            {saving
                                ? "Please wait..."
                                : isRegister
                                  ? "Create Account"
                                  : "Sign In"}
                        </button>
                    </form>
                    <p className="mt-6 text-center text-sm text-gray-600 dark:text-gray-400">
                        {isRegister
                            ? "Already have an account?"
                            : "Don't have an account?"}{" "}
                        <NavLink
                            className="font-medium text-indigo-600 hover:text-indigo-700"
                            to={isRegister ? "/login" : "/register"}
                        >
                            {isRegister ? "Login here" : "Create an account"}
                        </NavLink>
                    </p>
                </Card>
                <p className="mt-6 text-center text-xs text-gray-400">
                    Library Management System
                </p>
            </div>
        </main>
    );
}
