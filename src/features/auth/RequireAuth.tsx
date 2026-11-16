import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { queryClient } from "../../app/queryClient";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function RequireAuth() {
    const token = useAuthStore((state) => state.token);
    const clearAuth = useAuthStore((state) => state.clearAuth);
    const { data, isLoading, error } = useQuery({
        queryKey: ["me", token],
        queryFn: () => api.get("/me"),
        enabled: Boolean(token),
        retry: false,
    });

    useEffect(() => {
        if (error instanceof ApiError && error.status === 401) {
            clearAuth();
            queryClient.clear();
        }
    }, [clearAuth, error]);

    if (!token) return <Navigate to="/login" replace />;
    if (isLoading)
        return (
            <main className="grid min-h-screen place-items-center p-6">
                <Loading />
            </main>
        );
    if (error instanceof ApiError && error.status === 401)
        return <Navigate to="/login" replace />;
    if (error)
        return (
            <main className="p-6">
                <LoadError error={error} />
            </main>
        );

    return <Outlet context={{ user: data.data }} />;
}
