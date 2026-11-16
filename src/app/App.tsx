import { useEffect } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./queryClient";
import { useUiStore } from "./stores";
import { AppLayout } from "./layout/AppLayout";
import { RequireAuth } from "../features/auth/RequireAuth";
import { AuthPage } from "../features/auth/AuthPage";
import { DashboardPage } from "../features/dashboard/DashboardPage";
import { BooksPage, BookDetails, BookEditor } from "../features/books/BooksPage";
import { MembersPage, MemberDetails, MemberEditor } from "../features/members/MembersPage";
import { CategoriesPage, CategoryEditor } from "../features/categories/CategoriesPage";
import { BorrowingsPage, BorrowingEditor } from "../features/borrowings/BorrowingsPage";
import { ReturnsPage } from "../features/returns/ReturnsPage";
import { ReportsPage } from "../features/reports/ReportsPage";
import { SettingsPage } from "../features/settings/SettingsPage";
import { ProfilePage } from "../features/profile/ProfilePage";

export function AppRoot() {
    const darkMode = useUiStore((state) => state.darkMode);

    useEffect(() => {
        document.documentElement.classList.toggle("dark", darkMode);
    }, [darkMode]);

    return (
        <QueryClientProvider client={queryClient}>
            <BrowserRouter>
                <Routes>
                    <Route path="/login" element={<AuthPage mode="login" />} />
                    <Route
                        path="/register"
                        element={<AuthPage mode="register" />}
                    />
                    <Route element={<RequireAuth />}>
                        <Route element={<AppLayout />}>
                            <Route index element={<DashboardPage />} />
                            <Route path="books" element={<BooksPage />} />
                            <Route path="books/new" element={<BookEditor />} />
                            <Route
                                path="books/:id/edit"
                                element={<BookEditor />}
                            />
                            <Route path="books/:id" element={<BookDetails />} />
                            <Route path="members" element={<MembersPage />} />
                            <Route
                                path="members/new"
                                element={<MemberEditor />}
                            />
                            <Route
                                path="members/:id/edit"
                                element={<MemberEditor />}
                            />
                            <Route
                                path="members/:id"
                                element={<MemberDetails />}
                            />
                            <Route
                                path="categories"
                                element={<CategoriesPage />}
                            />
                            <Route
                                path="categories/new"
                                element={<CategoryEditor />}
                            />
                            <Route
                                path="categories/:id/edit"
                                element={<CategoryEditor />}
                            />
                            <Route
                                path="borrowings"
                                element={<BorrowingsPage />}
                            />
                            <Route
                                path="borrowings/new"
                                element={<BorrowingEditor />}
                            />
                            <Route
                                path="borrowings/:id/edit"
                                element={<BorrowingEditor />}
                            />
                            <Route path="returns" element={<ReturnsPage />} />
                            <Route path="reports" element={<ReportsPage />} />
                            <Route path="settings" element={<SettingsPage />} />
                            <Route path="profile" element={<ProfilePage />} />
                        </Route>
                    </Route>
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </BrowserRouter>
        </QueryClientProvider>
    );
}
