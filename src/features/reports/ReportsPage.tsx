import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function ReportsPage() {
    const [period, setPeriod] = useState("this_month");
    const { data, isLoading, error } = useQuery({
        queryKey: ["reports", period],
        queryFn: () => api.get(`/reports?period=${period}`),
    });
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const maxCount = Math.max(
        1,
        ...data.monthly_data.map((item) => item.count),
    );
    const maxPopular = Math.max(
        1,
        ...data.popular_books.map((item) => item.borrow_count),
    );
    return (
        <>
            <PageTitle
                title="Reports"
                description="View library statistics and activity reports."
            />
            <Card className="mb-6 flex flex-col gap-4 p-5 sm:flex-row sm:items-end">
                <label className="block w-full sm:max-w-xs">
                    <span className="text-sm font-medium">Period</span>
                    <select
                        className={inputClass}
                        value={period}
                        onChange={(event) => setPeriod(event.target.value)}
                    >
                        <option value="this_month">This Month</option>
                        <option value="last_month">Last Month</option>
                        <option value="this_year">This Year</option>
                    </select>
                </label>
                <p className="text-sm text-gray-500">
                    Showing {data.start_date} to {data.end_date}
                </p>
            </Card>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                <StatCard
                    title="Total Borrowings"
                    value={data.total_borrowings}
                    icon="📖"
                />
                <StatCard
                    title="Returned Books"
                    value={data.returned_books}
                    icon="🔄"
                />
                <StatCard
                    title="Overdue"
                    value={data.overdue_books}
                    icon="⚠️"
                />
                <StatCard
                    title="Collected Fines"
                    value={`₱${Number(data.collected_fines).toFixed(2)}`}
                    icon="💰"
                />
            </div>
            <div className="mt-6 grid gap-6 lg:grid-cols-2">
                <Card className="p-6">
                    <h2 className="font-semibold">Borrowing Activity</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Monthly borrowing overview
                    </p>
                    <div className="mt-6 flex h-64 items-end gap-2 border-b border-l border-gray-200 px-2 pb-2">
                        {data.monthly_data.map((item) => (
                            <div
                                key={item.month}
                                className="flex h-full flex-1 flex-col items-center justify-end"
                            >
                                <span className="mb-1 text-xs text-gray-500">
                                    {item.count}
                                </span>
                                <div
                                    className="w-full max-w-8 rounded-t bg-indigo-500"
                                    style={{
                                        height: `${Math.max(item.count ? 4 : 0, (item.count / maxCount) * 80)}%`,
                                    }}
                                />
                            </div>
                        ))}
                    </div>
                    <div className="mt-2 flex gap-2">
                        {data.monthly_data.map((item) => (
                            <span
                                key={item.month}
                                className="flex-1 text-center text-[10px] text-gray-500"
                            >
                                {item.month}
                            </span>
                        ))}
                    </div>
                </Card>
                <Card className="p-6">
                    <h2 className="font-semibold">Most Borrowed Books</h2>
                    <p className="mt-1 text-sm text-gray-500">
                        Top performing books
                    </p>
                    <div className="mt-5 space-y-5">
                        {data.popular_books.length ? (
                            data.popular_books.map((item) => (
                                <div key={item.book_id}>
                                    <div className="mb-2 flex justify-between gap-3 text-sm">
                                        <span className="truncate font-medium">
                                            {item.book?.title || "Unknown Book"}
                                        </span>
                                        <span className="shrink-0 text-gray-500">
                                            {item.borrow_count} loans
                                        </span>
                                    </div>
                                    <div className="h-2 overflow-hidden rounded-full bg-gray-100">
                                        <div
                                            className="h-full rounded-full bg-indigo-500"
                                            style={{
                                                width: `${(item.borrow_count / maxPopular) * 100}%`,
                                            }}
                                        />
                                    </div>
                                </div>
                            ))
                        ) : (
                            <p className="py-8 text-center text-sm text-gray-500">
                                No borrowing data available for this period.
                            </p>
                        )}
                    </div>
                </Card>
            </div>
        </>
    );
}
