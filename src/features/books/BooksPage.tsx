import React, { useEffect, useState } from "react";
import { NavLink, Navigate, Outlet, useNavigate, useOutletContext, useParams, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, ApiError, assetUrl } from "../../shared/api/client";
import { useAuthStore, useUiStore } from "../../app/stores";
import { Alert, Avatar, Badge, buttonClass, Card, Field, formatDate, Info, inputClass, LoadError, Loading, messageFrom, PageTitle, Pagination, RecordForm, secondaryButtonClass, StatCard, Table } from "../../shared/ui/components";

export function BooksPage() {
    const [searchParams, setSearchParams] = useSearchParams();
    const search = searchParams.get("search") || "";
    const categoryId = searchParams.get("category_id") || "";
    const page = searchParams.get("page") || "1";
    const queryString = new URLSearchParams({
        search,
        category_id: categoryId,
        page,
    }).toString();
    const { data, isLoading, error } = useQuery({
        queryKey: ["books", queryString],
        queryFn: () => api.get(`/books?${queryString}`),
    });
    const client = useQueryClient();
    const remove = useMutation({
        mutationFn: (id) => api.delete(`/books/${id}`),
        onSuccess: () => client.invalidateQueries({ queryKey: ["books"] }),
    });
    const [searchValue, setSearchValue] = useState(search);
    const categories = data?.categories || [];
    const paginator = data?.data;

    function updateFilters(values) {
        setSearchParams({ ...values, page: "1" });
    }

    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;

    return (
        <>
            <PageTitle
                title="Books"
                description="Manage your library books and inventory."
                action={
                    <NavLink className={buttonClass} to="/books/new">
                        ＋ Add Book
                    </NavLink>
                }
            />
            <Card className="mb-6 p-4">
                <form
                    className="grid gap-4 md:grid-cols-3"
                    onSubmit={(event) => {
                        event.preventDefault();
                        updateFilters({
                            search: searchValue,
                            category_id: categoryId,
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
                            placeholder="Title, author, or ISBN"
                        />
                    </label>
                    <label>
                        <span className="text-sm font-medium">Category</span>
                        <select
                            className={inputClass}
                            value={categoryId}
                            onChange={(event) =>
                                updateFilters({
                                    search,
                                    category_id: event.target.value,
                                })
                            }
                        >
                            <option value="">All Categories</option>
                            {categories.map((category) => (
                                <option key={category.id} value={category.id}>
                                    {category.name}
                                </option>
                            ))}
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
                        "Book",
                        "ISBN",
                        "Category",
                        "Inventory",
                        "Shelf",
                        "Actions",
                    ]}
                    rows={(paginator?.data || []).map((book) => [
                        <div>
                            <NavLink
                                className="font-medium text-indigo-700 hover:underline"
                                to={`/books/${book.id}`}
                            >
                                {book.title}
                            </NavLink>
                            <p className="mt-1 text-xs text-gray-500">
                                by {book.author}
                            </p>
                        </div>,
                        book.isbn,
                        book.category?.name,
                        <span>
                            {book.available_quantity} available ·{" "}
                            {book.quantity} total
                        </span>,
                        book.shelf_location || "—",
                        <div className="flex gap-2">
                            <NavLink
                                className="text-indigo-600"
                                to={`/books/${book.id}/edit`}
                            >
                                Edit
                            </NavLink>
                            <button
                                className="text-red-600"
                                onClick={() =>
                                    window.confirm("Delete this book?") &&
                                    remove.mutate(book.id)
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
                        setSearchParams({
                            search,
                            category_id: categoryId,
                            page: String(next),
                        })
                    }
                />
            </Card>
        </>
    );
}

export const bookFields = (categories) => [
    { name: "title", label: "Book Title", required: true },
    { name: "isbn", label: "ISBN", required: true },
    { name: "author", label: "Author", required: true },
    {
        name: "category_id",
        label: "Category",
        type: "select",
        required: true,
        options: categories.map((item) => ({
            value: item.id,
            label: item.name,
        })),
    },
    { name: "publisher", label: "Publisher" },
    { name: "publication_year", label: "Publication Year", type: "number" },
    {
        name: "quantity",
        label: "Total Copies",
        type: "number",
        min: 0,
        required: true,
    },
    { name: "shelf_location", label: "Shelf Location" },
    { name: "description", label: "Description", multiline: true, wide: true },
];

export function BookEditor() {
    const { id } = useParams();
    const editing = Boolean(id);
    const navigate = useNavigate();
    const client = useQueryClient();
    const categoriesQuery = useQuery({
        queryKey: ["categories-options"],
        queryFn: () => api.get("/categories/options"),
    });
    const bookQuery = useQuery({
        queryKey: ["book", id],
        queryFn: () => api.get(`/books/${id}`),
        enabled: editing,
    });
    const save = useMutation({
        mutationFn: (values: Record<string, FormDataEntryValue>) =>
            editing
                ? api.put(`/books/${id}`, values)
                : api.post("/books", values),
        onSuccess: () => {
            client.invalidateQueries({ queryKey: ["books"] });
            client.invalidateQueries({ queryKey: ["dashboard"] });
            navigate("/books");
        },
    });

    if (categoriesQuery.isLoading || bookQuery.isLoading) return <Loading />;
    if (categoriesQuery.error || bookQuery.error)
        return <LoadError error={categoriesQuery.error || bookQuery.error} />;
    const categories = categoriesQuery.data.data;

    return (
        <>
            <PageTitle
                title={editing ? "Edit Book" : "Add New Book"}
                description="Maintain the book details and inventory."
            />
            <RecordForm
                fields={bookFields(categories)}
                initial={bookQuery.data?.data || {}}
                wide
                submitLabel={editing ? "Update Book" : "Save Book"}
                cancelTo="/books"
                onSubmit={(values) => save.mutateAsync(values)}
            />
        </>
    );
}

export function BookDetails() {
    const { id } = useParams();
    const { data, isLoading, error } = useQuery({
        queryKey: ["book", id],
        queryFn: () => api.get(`/books/${id}`),
    });
    if (isLoading) return <Loading />;
    if (error) return <LoadError error={error} />;
    const book = data.data;
    return (
        <>
            <PageTitle
                title="Book Details"
                action={
                    <div className="flex gap-2">
                        <NavLink to="/books" className={secondaryButtonClass}>
                            Back
                        </NavLink>
                        <NavLink
                            to={`/books/${id}/edit`}
                            className={buttonClass}
                        >
                            Edit
                        </NavLink>
                    </div>
                }
            />
            <Card className="p-6">
                <h2 className="text-xl font-bold">{book.title}</h2>
                <p className="mt-1 text-gray-500">by {book.author}</p>
                <div className="mt-6 grid gap-5 sm:grid-cols-2">
                    {[
                        ["ISBN", book.isbn],
                        ["Category", book.category?.name],
                        ["Publisher", book.publisher],
                        ["Publication Year", book.publication_year],
                        ["Shelf Location", book.shelf_location],
                        ["Total Copies", book.quantity],
                        ["Available Copies", book.available_quantity],
                        [
                            "Borrowed Copies",
                            book.quantity - book.available_quantity,
                        ],
                    ].map(([label, value]) => (
                        <div key={label}>
                            <p className="text-xs text-gray-500">{label}</p>
                            <p className="mt-1 font-medium">{value || "—"}</p>
                        </div>
                    ))}
                </div>
                <div className="mt-6 border-t border-gray-200 pt-5">
                    <h3 className="font-semibold">Description</h3>
                    <p className="mt-2 whitespace-pre-wrap text-sm text-gray-600">
                        {book.description || "No description provided."}
                    </p>
                </div>
            </Card>
        </>
    );
}
