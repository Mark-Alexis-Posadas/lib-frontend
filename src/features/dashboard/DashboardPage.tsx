import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function DashboardPage() {
    const { data, isLoading, error } = useQuery({
        queryKey: ["dashboard"],
        queryFn: () => api.get("/dashboard"),
    });
    const stats = data?.stats;

    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;

    return (
        <>
            <PageTitle
                title="Dashboard"
                description="Here's what's happening in your library today."
            />
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
                <StatCard
                    title="Total Books"
                    value={stats.total_books}
                    icon="📚"
                />
                <StatCard
                    title="Total Members"
                    value={stats.total_members}
                    icon="👥"
                />
                <StatCard
                    title="Borrowed Books"
                    value={stats.borrowed_books}
                    icon="📖"
                />
                <StatCard
                    title="Overdue Books"
                    value={stats.overdue_books}
                    icon="⚠️"
                />
            </div>
            <div className="mt-6 grid gap-6 xl:grid-cols-3">
                <Card className="overflow-hidden xl:col-span-2">
                    <div className="border-b border-gray-200 px-6 py-4 dark:border-gray-800">
                        <h2 className="font-semibold">Recent Borrowings</h2>
                        <p className="mt-1 text-xs text-gray-500">
                            Latest library transactions
                        </p>
                    </div>
                    <Table
                        headers={["Member", "Book", "Due Date", "Status"]}
                        rows={(data.recent_borrowings || []).map((item) => [
                            <span>
                                {item.member?.first_name}{" "}
                                {item.member?.last_name}
                            </span>,
                            item.book?.title,
                            formatDate(item.due_at),
                            <Badge value={item.status} />,
                        ])}
                    />
                </Card>
                <Card className="p-6">
                    <h2 className="font-semibold">Popular Books</h2>
                    <p className="mt-1 text-xs text-gray-500">
                        Most borrowed books
                    </p>
                    <div className="mt-4 space-y-4">
                        {(data.popular_books || []).map((item) => (
                            <div
                                key={item.book_id}
                                className="flex items-center justify-between gap-3"
                            >
                                <div className="min-w-0">
                                    <p className="truncate text-sm font-semibold">
                                        {item.book?.title || "Unknown book"}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {item.book?.author}
                                    </p>
                                </div>
                                <span className="shrink-0 text-xs text-gray-500">
                                    {item.borrow_count} loans
                                </span>
                            </div>
                        ))}
                    </div>
                </Card>
            </div>
            <div className="mt-6">
                <h2 className="mb-4 text-lg font-semibold">Quick Actions</h2>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    {[
                        ["/books/new", "📚", "Add Book"],
                        ["/members/new", "👤", "Add Member"],
                        ["/borrowings/new", "📖", "Borrow Book"],
                        ["/returns", "🔄", "Return Book"],
                    ].map(([to, icon, text]) => (
                        <NavLink
                            key={to}
                            to={to}
                            className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-indigo-300 dark:border-gray-800 dark:bg-gray-900"
                        >
                            <div className="mb-3 text-2xl">{icon}</div>
                            <p className="font-semibold">{text}</p>
                        </NavLink>
                    ))}
                </div>
            </div>
        </>
    );
}
