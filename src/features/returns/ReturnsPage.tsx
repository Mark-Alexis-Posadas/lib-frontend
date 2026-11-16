import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function ReturnsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const page = searchParams.get("page") || "1";
    const [searchValue, setSearchValue] = useState(search);
    const queryString = new URLSearchParams({ search, page }).toString();
    const { data, isLoading, error } = useQuery({
        queryKey: ["returns", queryString],
        queryFn: () => api.get(`/returns?${queryString}`),
    });
    const settingsQuery = useQuery({
        queryKey: ["settings"],
        queryFn: () => api.get("/settings"),
    });
    const client = useQueryClient();
    const returnMutation = useMutation({
        mutationFn: (id) => api.post(`/returns/${id}`),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["returns"] });
            client.invalidateQueries({ queryKey: ["borrowings"] });
            client.invalidateQueries({ queryKey: ["dashboard"] });
        },
    });
    if (isLoading || settingsQuery.isLoading) return <Loading />;
    if (error || settingsQuery.error)
        return <LoadError error={error || settingsQuery.error} />;
    const paginator = data.data;
    const finePerDay = Number(settingsQuery.data.data.fine_per_day);
    return (
        <>
            <PageTitle
                title="Return Books"
                description="Process returned books and manage overdue fines."
            />
            <Card className="mb-6 p-4">
                <form
                    className="flex flex-col gap-3 sm:flex-row"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setSearchParams({ search: searchValue, page: "1" });
                    }}
                >
                    <label className="block flex-1">
                        <span className="text-sm font-medium">Search</span>
                        <input
                            className={inputClass}
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(event.target.value)
                            }
                            placeholder="Search member, book, or transaction"
                        />
                    </label>
                    <button className={`${buttonClass} self-end`}>
                        Search
                    </button>
                </form>
            </Card>
            {returnMutation.error && (
                <Alert>{messageFrom(returnMutation.error)}</Alert>
            )}
            <Card className="overflow-hidden">
                <Table
                    headers={[
                        "Member",
                        "Book",
                        "Due Date",
                        "Days Overdue",
                        "Estimated Fine",
                        "Action",
                    ]}
                    rows={paginator.data.map((item) => {
                        const dueDate = new Date(
                            `${item.due_at.slice(0, 10)}T00:00:00`,
                        );
                        const overdue = Math.max(
                            0,
                            Math.floor(
                                (Date.now() - dueDate.getTime()) / 86400000,
                            ),
                        );
                        const fine = overdue * finePerDay;
                        return [
                            <span>
                                {item.member?.first_name}{" "}
                                {item.member?.last_name}
                            </span>,
                            item.book?.title,
                            formatDate(item.due_at),
                            `${overdue} day${overdue === 1 ? "" : "s"}`,
                            <span
                                className={
                                    fine
                                        ? "font-semibold text-red-600"
                                        : "font-semibold text-green-600"
                                }
                            >
                                ₱{fine.toFixed(2)}
                            </span>,
                            <button
                                className={buttonClass}
                                disabled={returnMutation.isPending}
                                onClick={() => returnMutation.mutate(item.id)}
                            >
                                Return
                            </button>,
                        ];
                    })}
                />
                <Pagination
                    paginator={paginator}
                    onPage={(next) =>
                        setSearchParams({ search, page: String(next) })
                    }
                />
            </Card>
        </>
    );
}
