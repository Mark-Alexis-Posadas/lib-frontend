import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function MembersPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "";
    const page = searchParams.get("page") || "1";
    const queryString = new URLSearchParams({
        search,
        status,
        page,
    }).toString();
    const [searchValue, setSearchValue] = useState(search);
    const { data, isLoading, error } = useQuery({
        queryKey: ["members", queryString],
        queryFn: () => api.get(`/members?${queryString}`),
    });
    const client = useQueryClient();
    const remove = useMutation({
        mutationFn: (id) => api.delete(`/members/${id}`),
        onSuccess: () => client.invalidateQueries({ queryKey: ["members"] }),
    });

    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const paginator = data.data;

    return (
        <>
            <PageTitle
                title="Members"
                description="Manage your library members."
                action={
                    <NavLink to="/members/new" className={buttonClass}>
                        ＋ Add Member
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
                            placeholder="Member ID, name, or email"
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
                            <option value="active">Active</option>
                            <option value="inactive">Inactive</option>
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
                        "Contact",
                        "Address",
                        "Status",
                        "Actions",
                    ]}
                    rows={paginator.data.map((member) => [
                        <div className="flex items-center gap-3">
                            <Avatar
                                user={{
                                    name: `${member.first_name} ${member.last_name}`,
                                }}
                            />
                            <div>
                                <NavLink
                                    className="font-medium text-indigo-700"
                                    to={`/members/${member.id}`}
                                >
                                    {member.first_name} {member.last_name}
                                </NavLink>
                                <p className="text-xs text-gray-500">
                                    {member.member_id}
                                </p>
                            </div>
                        </div>,
                        <div>
                            {member.email}
                            <p className="text-xs text-gray-500">
                                {member.phone}
                            </p>
                        </div>,
                        member.address || "—",
                        <Badge value={member.status} />,
                        <div className="flex gap-2">
                            <NavLink
                                className="text-indigo-600"
                                to={`/members/${member.id}/edit`}
                            >
                                Edit
                            </NavLink>
                            <button
                                className="text-red-600"
                                onClick={() =>
                                    window.confirm("Delete this member?") &&
                                    remove.mutate(member.id)
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

export const memberFields = [
    { name: "first_name", label: "First Name", required: true },
    { name: "last_name", label: "Last Name", required: true },
    { name: "email", label: "Email Address", type: "email", required: true },
    { name: "phone", label: "Phone Number" },
    { name: "member_id", label: "Member ID", required: true },
    {
        name: "status",
        label: "Status",
        required: true,
        options: [
            { value: "active", label: "Active" },
            { value: "inactive", label: "Inactive" },
        ],
    },
    { name: "address", label: "Address", multiline: true, wide: true },
];

export function MemberEditor() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const client = useQueryClient();
    const memberQuery = useQuery({
        queryKey: ["member", id],
        queryFn: () => api.get(`/members/${id}`),
        enabled: editing,
    });
    const save = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            editing
                ? api.put(`/members/${id}`, values)
                : api.post("/members", values),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["members"] });
            navigate("/members");
        },
    });
    if (memberQuery.isLoading) return <Loading />;
    if (memberQuery.error) return <LoadError error={memberQuery.error} />;
    return (
        <>
            <PageTitle
                title={editing ? "Edit Member" : "Add New Member"}
                description="Update the library member record."
            />
            <RecordForm
                fields={memberFields}
                initial={memberQuery.data?.data || { status: "active" }}
                wide
                cancelTo="/members"
                submitLabel={editing ? "Update Member" : "Save Member"}
                onSubmit={(values) => save.mutateAsync(values)}
            />
        </>
    );
}

export function MemberDetails() {
    const { id } = useParams();
    const { data, isLoading, error } = useQuery({
        queryKey: ["member", id],
        queryFn: () => api.get(`/members/${id}`),
    });
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const member = data.data;
    return (
        <>
            <PageTitle
                title="Member Details"
                action={
                    <NavLink to="/members" className={secondaryButtonClass}>
                        Back to Members
                    </NavLink>
                }
            />
            <div className="grid gap-6 lg:grid-cols-3">
                <Card className="p-6">
                    <div className="text-center">
                        <Avatar
                            user={{
                                name: `${member.first_name} ${member.last_name}`,
                            }}
                            size="h-24 w-24 text-3xl mx-auto"
                        />
                        <h2 className="mt-4 text-xl font-bold">
                            {member.first_name} {member.last_name}
                        </h2>
                        <p className="text-sm text-gray-500">
                            {member.member_id}
                        </p>
                        <div className="mt-3">
                            <Badge value={member.status} />
                        </div>
                    </div>
                    <div className="mt-6 space-y-4 border-t border-gray-200 pt-6">
                        <Info label="Email" value={member.email} />
                        <Info label="Phone" value={member.phone} />
                        <Info label="Address" value={member.address} />
                        <Info
                            label="Member Since"
                            value={new Date(
                                member.created_at,
                            ).toLocaleDateString()}
                        />
                    </div>
                </Card>
                <Card className="overflow-hidden lg:col-span-2">
                    <div className="border-b border-gray-200 px-6 py-4">
                        <h2 className="font-semibold">Borrowing History</h2>
                    </div>
                    <Table
                        headers={["Book", "Borrowed", "Due Date", "Status"]}
                        rows={(member.borrowings || []).map((item) => [
                            item.book?.title,
                            formatDate(item.borrowed_at),
                            formatDate(item.due_at),
                            <Badge value={item.status} />,
                        ])}
                    />
                </Card>
            </div>
        </>
    );
}
