import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function CategoriesPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const page = searchParams.get("page") || "1";
    const { data, isLoading, error } = useQuery({
        queryKey: ["categories", page],
        queryFn: () => api.get(`/categories?page=${page}`),
    });
    const client = useQueryClient();
    const remove = useMutation({
        mutationFn: (id) => api.delete(`/categories/${id}`),
        onSuccess: () => client.invalidateQueries({ queryKey: ["categories"] }),
    });
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const paginator = data.data;
    return (
        <>
            <PageTitle
                title="Categories"
                description="Manage your library book categories."
                action={
                    <NavLink to="/categories/new" className={buttonClass}>
                        ＋ Add Category
                    </NavLink>
                }
            />
            {remove.error && <LoadError error={remove.error} />}
            <Card className="overflow-hidden">
                <Table
                    headers={["Category", "Description", "Books", "Actions"]}
                    rows={paginator.data.map((category) => [
                        <NavLink
                            className="font-medium text-indigo-700"
                            to={`/categories/${category.id}/edit`}
                        >
                            {category.name}
                        </NavLink>,
                        category.description || "No description",
                        category.books_count,
                        <div className="flex gap-2">
                            <NavLink
                                className="text-indigo-600"
                                to={`/categories/${category.id}/edit`}
                            >
                                Edit
                            </NavLink>
                            <button
                                className="text-red-600"
                                onClick={() =>
                                    window.confirm("Delete this category?") &&
                                    remove.mutate(category.id)
                                }
                            >
                                Delete
                            </button>
                        </div>,
                    ])}
                />
                <Pagination
                    paginator={paginator}
                    onPage={(next) => setSearchParams({ page: String(next) })}
                />
            </Card>
        </>
    );
}

export function CategoryEditor() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const client = useQueryClient();
    const categoryQuery = useQuery({
        queryKey: ["category", id],
        queryFn: () => api.get(`/categories/${id}`),
        enabled: editing,
    });
    const save = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            editing
                ? api.put(`/categories/${id}`, values)
                : api.post("/categories", values),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["categories"] });
            client.invalidateQueries({ queryKey: ["categories-options"] });
            navigate("/categories");
        },
    });
    if (categoryQuery.isLoading) return <Loading />;
    if (categoryQuery.error) return <LoadError error={categoryQuery.error} />;
    return (
        <>
            <PageTitle title={editing ? "Edit Category" : "Add Category"} />
            <RecordForm
                fields={[
                    { name: "name", label: "Category Name", required: true },
                    {
                        name: "description",
                        label: "Description",
                        multiline: true,
                    },
                ]}
                initial={categoryQuery.data?.data || {}}
                cancelTo="/categories"
                submitLabel="Save Category"
                onSubmit={(values) => save.mutateAsync(values)}
            />
        </>
    );
}
