import { useAuthStore } from "../../app/stores";

interface ApiErrorResponse {
    message?: string;
    errors?: Record<string, string[]>;
}

interface RequestOptions {
    method?: string;
    body?: FormData | Record<string, unknown>;
}

const apiBaseUrl = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

export class ApiError extends Error {
    status: number;
    errors: Record<string, string[]>;

    constructor(message: string, status: number, errors: Record<string, string[]> = {}) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.errors = errors;
    }
}

async function request<T = any>(
    path: string,
    { method = "GET", body }: RequestOptions = {},
): Promise<T> {
    const headers = new Headers({ Accept: "application/json" });
    const token = useAuthStore.getState().token;
    let payload: BodyInit | undefined;

    if (token) {
        headers.set("Authorization", `Bearer ${token}`);
    }

    if (body instanceof FormData) {
        payload = body;
    } else if (body) {
        headers.set("Content-Type", "application/json");
        payload = JSON.stringify(body);
    }

    const response = await fetch(`${apiBaseUrl}/api${path}`, {
        method,
        headers,
        body: payload,
    });

    const data: ApiErrorResponse | null =
        response.status === 204 ? null : await response.json();

    if (!response.ok) {
        if (response.status === 401 && token) {
            useAuthStore.getState().clearAuth();
        }

        throw new ApiError(
            data?.message || "The request could not be completed.",
            response.status,
            data?.errors,
        );
    }

    return data as T;
}

export const assetUrl = (path: string): string => `${apiBaseUrl}${path}`;

export const api = {
    get: <T = any>(path: string): Promise<T> => request<T>(path),
    post: <T = any>(path: string, body?: FormData | Record<string, unknown>): Promise<T> =>
        request<T>(path, { method: "POST", body }),
    put: <T = any>(path: string, body?: FormData | Record<string, unknown>): Promise<T> =>
        request<T>(path, { method: "PUT", body }),
    delete: <T = any>(path: string): Promise<T> =>
        request<T>(path, { method: "DELETE" }),
};
