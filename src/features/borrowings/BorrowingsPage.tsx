import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function BorrowingsPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = searchParams.get("page") || "1";
    const [searchValue, setSearchValue] = useState(search);
    const params = new URLSearchParams({ search, status, page });
    const { data, isLoading, error } = useQuery({
        queryKey: ["borrowings", params.toString()],
        queryFn: () => api.get(`/borrowings?${params}`),
    });
    const client = useQueryClient();
    const remove = useMutation({
        mutationFn: (id) => api.delete(`/borrowings/${id}`),
        onSuccess: () => client.invalidateQueries({ queryKey: ["borrowings"] }),
    });
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const paginator = data.data;
    return (
        <>
            <PageTitle
                title="Borrowings"
                description="Manage book borrowings and returns."
                action={
                    <NavLink to="/borrowings/new" className={buttonClass}>
                        ＋ New Borrowing
                    </NavLink>
                }
            />
            <Card className="mb-6 p-4">
                <form
                    className="grid gap-4 md:grid-cols-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        setSearchParams({
                            search: searchValue,
                            status,
                            page: "1",
                        });
                    }}
                >
                    <label className="md:col-span-2">
                        <span className="text-sm font-medium">Search</span>
                        <input
                            className={inputClass}
                            value={searchValue}
                            onChange={(event) =>
                                setSearchValue(event.target.value)
                            }
                            placeholder="Member, member ID, book title, or ISBN"
                        />
                    </label>
                    <label>
                        <span className="text-sm font-medium">Status</span>
                        <select
                            className={inputClass}
                            value={status}
                            onChange={(event) =>
                                setSearchParams({
                                    search,
                                    status: event.target.value,
                                    page: "1",
                                })
                            }
                        >
                            <option value="">All Status</option>
                            {["borrowed", "returned", "overdue"].map(
                                (value) => (
                                    <option key={value} value={value}>
                                        {value}
                                    </option>
                                ),
                            )}
                        </select>
                    </label>
                    <div className="flex gap-2 md:col-span-3">
                        <button className={buttonClass}>Search</button>
                        <button
                            type="button"
                            className={secondaryButtonClass}
                            onClick={() => {
                                setSearchValue("");
                                setSearchParams({});
                            }}
                        >
                            Clear
                        </button>
                    </div>
                </form>
            </Card>
            {remove.error && <LoadError error={remove.error} />}
            <Card className="overflow-hidden">
                <Table
                    headers={[
                        "Member",
                        "Book",
                        "Borrowed",
                        "Due Date",
                        "Status",
                        "Actions",
                    ]}
                    rows={paginator.data.map((item) => [
                        <div>
                            {item.member?.first_name} {item.member?.last_name}
                            <p className="text-xs text-gray-500">
                                {item.member?.member_id}
                            </p>
                        </div>,
                        <div>
                            {item.book?.title}
                            <p className="text-xs text-gray-500">
                                {item.book?.isbn}
                            </p>
                        </div>,
                        formatDate(item.borrowed_at),
                        formatDate(item.due_at),
                        <Badge value={item.status} />,
                        <div className="flex gap-2">
                            <NavLink
                                className="text-indigo-600"
                                to={`/borrowings/${item.id}/edit`}
                            >
                                Edit
                            </NavLink>
                            <button
                                className="text-red-600"
                                onClick={() =>
                                    window.confirm(
                                        "Delete this borrowing record?",
                                    ) && remove.mutate(item.id)
                                }
                            >
                                Delete
                            </button>
                        </div>,
                    ])}
                />
                <Pagination
                    paginator={paginator}
                    onPage={(next) =>
                        setSearchParams({ search, status, page: String(next) })
                    }
                />
            </Card>
        </>
    );
}

export const borrowingFields = (members, books) => [
    {
        name: "member_id",
        label: "Member",
        required: true,
        options: members.map((item) => ({
            value: item.id,
            label: `${item.member_id} — ${item.first_name} ${item.last_name}`,
        })),
    },
    {
        name: "book_id",
        label: "Book",
        required: true,
        options: books.map((item) => ({
            value: item.id,
            label: `${item.title}${item.isbn ? ` — ${item.isbn}` : ""}`,
        })),
    },
    {
        name: "borrowed_at",
        label: "Borrowed Date",
        type: "date",
        required: true,
    },
    { name: "due_at", label: "Due Date", type: "date", required: true },
    {
        name: "status",
        label: "Status",
        required: true,
        options: ["borrowed", "returned", "overdue"].map((value) => ({
            value,
            label: value,
        })),
    },
    { name: "returned_at", label: "Returned Date", type: "date" },
    { name: "fine", label: "Fine", type: "number", min: 0, step: ".01" },
    { name: "notes", label: "Notes", multiline: true, wide: true },
];

export function BorrowingEditor() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const client = useQueryClient();
    const optionsQuery = useQuery({
        queryKey: ["borrowing-options"],
        queryFn: () => api.get("/borrowings/options"),
    });
    const borrowingQuery = useQuery({
        queryKey: ["borrowing", id],
        queryFn: () => api.get(`/borrowings/${id}`),
        enabled: editing,
    });
    const save = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            editing
                ? api.put(`/borrowings/${id}`, values)
                : api.post("/borrowings", values),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["borrowings"] });
            client.invalidateQueries({ queryKey: ["dashboard"] });
            navigate("/borrowings");
        },
    });
    if (optionsQuery.isLoading || borrowingQuery.isLoading) return <Loading />;
    if (optionsQuery.error || borrowingQuery.error)
        return <LoadError error={optionsQuery.error || borrowingQuery.error} />;
    return (
        <>
            <PageTitle
                title={editing ? "Edit Borrowing" : "New Borrowing"}
                description="Create or update a book borrowing record."
            />
            <RecordForm
                fields={borrowingFields(
                    optionsQuery.data.members,
                    optionsQuery.data.books,
                )}
                initial={
                    borrowingQuery.data?.data || {
                        borrowed_at: new Date().toISOString().slice(0, 10),
                        status: "borrowed",
                        fine: 0,
                    }
                }
                wide
                cancelTo="/borrowings"
                submitLabel={editing ? "Update Borrowing" : "Create Borrowing"}
                onSubmit={(values) => save.mutateAsync(values)}
            />
        </>
    );
}
