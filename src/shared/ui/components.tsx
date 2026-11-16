import { useState, type ReactNode } from "react";
import { NavLink } from "react-router-dom";
import { ApiError, assetUrl } from "../api/client";
import type { User } from "../types";

interface FieldDefinition {
    name: string;
    label: string;
    type?: string;
    required?: boolean;
    placeholder?: string;
    min?: string | number;
    max?: string | number;
    step?: string | number;
    wide?: boolean;
    multiline?: boolean;
    rows?: number;
    options?: { value: string | number; label: string }[];
}

interface PageTitleProps {
    title: string;
    description?: string;
    action?: ReactNode;
}

interface RecordFormProps {
    fields: FieldDefinition[];
    initial?: Record<string, string | number | null | undefined>;
    submitLabel?: string;
    onSubmit: (values: Record<string, FormDataEntryValue>) => Promise<unknown>;
    cancelTo: string;
    wide?: boolean;
}

export const inputClass =
    "mt-1 block w-full rounded-lg border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white";

export const buttonClass =
    "inline-flex items-center justify-center rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60";

export const secondaryButtonClass =
    "inline-flex items-center justify-center rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800";

export function messageFrom(error: unknown) {
    if (error instanceof ApiError) {
        return error.message;
    }

    return error instanceof Error ? error.message : "Something went wrong.";
}

export function PageTitle({ title, description, action }: PageTitleProps) {
    return (
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                    {title}
                </h1>
                {description && (
                    <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                        {description}
                    </p>
                )}
            </div>
            {action}
        </div>
    );
}

export function Alert({
    children,
    tone = "error",
}: {
    children?: ReactNode;
    tone?: "error" | "success";
}) {
    const colors =
        tone === "success"
            ? "border-green-200 bg-green-50 text-green-700 dark:border-green-900 dark:bg-green-950/40 dark:text-green-300"
            : "border-red-200 bg-red-50 text-red-700 dark:border-red-900 dark:bg-red-950/40 dark:text-red-300";

    return (
        <div
            role="alert"
            className={`mb-5 rounded-lg border px-4 py-3 text-sm ${colors}`}
        >
            {children}
        </div>
    );
}

export function Loading() {
    return (
        <div className="rounded-xl border border-gray-200 bg-white p-8 text-center text-sm text-gray-500 dark:border-gray-800 dark:bg-gray-900">
            Loading...
        </div>
    );
}

export function LoadError({ error }: { error: unknown }) {
    return <Alert>{messageFrom(error)}</Alert>;
}

export function Card({
    children,
    className = "",
    id,
}: {
    children?: ReactNode;
    className?: string;
    id?: string;
}) {
    return (
        <section
            id={id}
            className={`rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 ${className}`}
        >
            {children}
        </section>
    );
}

export function Field({
    field,
    value,
    onChange,
}: {
    field: FieldDefinition;
    value?: string | number | null;
    onChange?: (name: string, value: string) => void;
}) {
    const common = {
        id: field.name,
        name: field.name,
        required: field.required,
        defaultValue: value ?? "",
        className: inputClass,
        placeholder: field.placeholder,
        min: field.min,
        max: field.max,
        step: field.step,
    };

    return (
        <label className={field.wide ? "block sm:col-span-2" : "block"}>
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {field.label}
            </span>
            {field.options ? (
                <select
                    {...common}
                    onChange={(event) =>
                        onChange?.(field.name, event.target.value)
                    }
                >
                    <option value="">
                        {field.placeholder ||
                            `Select ${field.label.toLowerCase()}`}
                    </option>
                    {field.options.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label}
                        </option>
                    ))}
                </select>
            ) : field.multiline ? (
                <textarea {...common} rows={field.rows || 4} />
            ) : (
                <input {...common} type={field.type || "text"} />
            )}
        </label>
    );
}

export function RecordForm({
    fields,
    initial = {},
    submitLabel = "Save",
    onSubmit,
    cancelTo,
    wide = false,
}: RecordFormProps) {
    const [error, setError] = useState<unknown>(null);
    const [saved, setSaved] = useState(false);
    const [saving, setSaving] = useState(false);

    async function submit(event) {
        event.preventDefault();
        setError(null);
        setSaved(false);
        setSaving(true);
        const values = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
        );

        try {
            await onSubmit(values);
            setSaved(true);
        } catch (requestError) {
            setError(requestError);
        } finally {
            setSaving(false);
        }
    }

    return (
        <Card className="p-6">
            <form onSubmit={submit}>
                {saved && (
                    <Alert tone="success">Changes saved successfully.</Alert>
                )}
                {error && (
                    <Alert>
                        <div>{messageFrom(error)}</div>
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
                )}
                <div className={`grid gap-5 ${wide ? "md:grid-cols-2" : ""}`}>
                    {fields.map((field) => (
                        <Field
                            key={field.name}
                            field={field}
                            value={initial[field.name]}
                        />
                    ))}
                </div>
                <div className="mt-8 flex justify-end gap-3 border-t border-gray-200 pt-5 dark:border-gray-800">
                    <NavLink to={cancelTo} className={secondaryButtonClass}>
                        Cancel
                    </NavLink>
                    <button className={buttonClass} disabled={saving}>
                        {saving ? "Saving..." : submitLabel}
                    </button>
                </div>
            </form>
        </Card>
    );
}

export function Avatar({
    user,
    size = "h-9 w-9",
}: {
    user?: Partial<User> | null;
    size?: string;
}) {
    if (user?.profile_image) {
        return (
            <img
                src={assetUrl(`/storage/${user.profile_image}`)}
                alt=""
                className={`${size} rounded-full object-cover`}
            />
        );
    }
    return (
        <span
            className={`${size} grid place-items-center rounded-full bg-indigo-100 font-semibold text-indigo-700 dark:bg-indigo-900/50 dark:text-indigo-300`}
        >
            {user?.name?.slice(0, 1).toUpperCase() || "U"}
        </span>
    );
}

export function StatCard({
    title,
    value,
    icon,
    description,
}: {
    title: string;
    value: number | string;
    icon: ReactNode;
    description?: string;
}) {
    const displayValue =
        typeof value === "number" ? value.toLocaleString() : value;
    return (
        <Card className="p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="mt-2 text-2xl font-bold">{displayValue}</p>
                    {description && (
                        <p className="mt-1 text-xs text-gray-500">
                            {description}
                        </p>
                    )}
                </div>
                <span className="text-3xl">{icon}</span>
            </div>
        </Card>
    );
}

export function Badge({ value }: { value?: string }) {
    const colors = {
        active: "bg-green-100 text-green-700",
        borrowed: "bg-blue-100 text-blue-700",
        returned: "bg-green-100 text-green-700",
        overdue: "bg-red-100 text-red-700",
        inactive: "bg-gray-100 text-gray-600",
    };
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${colors[value] || "bg-gray-100 text-gray-700"}`}
        >
            {value?.charAt(0).toUpperCase() + value?.slice(1)}
        </span>
    );
}

export function Table({
    headers,
    rows,
}: {
    headers: string[];
    rows: ReactNode[][];
}) {
    return (
        <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                <thead className="bg-gray-50 dark:bg-gray-800/60">
                    <tr>
                        {headers.map((header) => (
                            <th
                                key={header}
                                className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"
                            >
                                {header}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {rows.length ? (
                        rows.map((row, index) => (
                            <tr
                                key={index}
                                className="hover:bg-gray-50 dark:hover:bg-gray-800/50"
                            >
                                {row.map((cell, cellIndex) => (
                                    <td
                                        key={cellIndex}
                                        className="whitespace-nowrap px-5 py-4 text-sm"
                                    >
                                        {cell}
                                    </td>
                                ))}
                            </tr>
                        ))
                    ) : (
                        <tr>
                            <td
                                colSpan={headers.length}
                                className="px-5 py-12 text-center text-sm text-gray-500"
                            >
                                No records found.
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export function Pagination({
    paginator,
    onPage,
}: {
    paginator: any;
    onPage: (page: number) => void;
}) {
    if (!paginator || paginator.last_page <= 1) return null;
    return (
        <div className="flex items-center justify-between border-t border-gray-200 px-5 py-4 text-sm dark:border-gray-800">
            <span>
                Page {paginator.current_page} of {paginator.last_page}
            </span>
            <div className="flex gap-2">
                <button
                    className={secondaryButtonClass}
                    disabled={!paginator.prev_page_url}
                    onClick={() => onPage(paginator.current_page - 1)}
                >
                    Previous
                </button>
                <button
                    className={secondaryButtonClass}
                    disabled={!paginator.next_page_url}
                    onClick={() => onPage(paginator.current_page + 1)}
                >
                    Next
                </button>
            </div>
        </div>
    );
}

export function Info({
    label,
    value,
}: {
    label: string;
    value?: ReactNode;
}) {
    return (
        <div>
            <p className="text-xs text-gray-500">{label}</p>
            <p className="mt-1 break-words text-sm font-medium">
                {value || "—"}
            </p>
        </div>
    );
}

export function formatDate(value?: string | null) {
    if (!value) return "—";
    const [year, month, day] = value.slice(0, 10).split("-").map(Number);
    return new Date(year, month - 1, day).toLocaleDateString(undefined, {
        month: "short",
        day: "2-digit",
        year: "numeric",
    });
}
