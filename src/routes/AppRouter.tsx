import {
  createBrowserRouter,
  RouterProvider,
  Navigate,
} from "react-router-dom";
import MainLayout from "@/layouts/MainLayout";

import HomePage from "@/pages/HomePage";
import LoginPage from "@/pages/LoginPage";
import AddPostPage from "@/pages/AddPostPage";
import PostDetailPage from "@/pages/PostDetailPage";
import UserProfilePage from "@/pages/UserProfilePage";
import RegisterPage from "@/pages/RegisterPage";
import RequireAuth from "@/routes/RequireAuth";
import RequireGuest from "@/routes/RequireGuest";
import SearchPage from "@/pages/SearchPage";
import { useAppSelector } from "@/app/hooks";

function ProfileRedirect() {
  const meId = useAppSelector((s) => s.auth.user?.id);
  if (!meId) return <Navigate to="/login" replace />;
  return <Navigate to={`/profile/${meId}`} replace />;
}

const router = createBrowserRouter([
  {
    path: "/",
    element: <MainLayout />,
    children: [
      { index: true, element: <Navigate to="/home" replace /> },
      { path: "/posts/:postId", element: <PostDetailPage /> },
      {
        path: "/login",
        element: (
          <RequireGuest>
            <LoginPage />
          </RequireGuest>
        ),
      },

      {
        path: "/register",
        element: (
          <RequireGuest>
            <RegisterPage />
          </RequireGuest>
        ),
      },

      {
        path: "/home",
        element: (
          <RequireAuth>
            <HomePage />
          </RequireAuth>
        ),
      },
      {
        path: "/posts/new",
        element: (
          <RequireAuth>
            <AddPostPage />
          </RequireAuth>
        ),
      },
      { path: "/search", element: <SearchPage /> },
      {
        path: "/profile",
        element: (
          <RequireAuth>
            <ProfileRedirect />
          </RequireAuth>
        ),
      },
      {
        path: "/profile/:userId",
        element: (
          <RequireAuth>
            <UserProfilePage />
          </RequireAuth>
        ),
      },

      { path: "*", element: <p>404</p> },
    ],
  },
]);

export default function AppRouter() {
  return <RouterProvider router={router} />;
}
