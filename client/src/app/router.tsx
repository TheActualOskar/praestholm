import { createBrowserRouter } from "react-router-dom";
import AppLayout from "./layout/AppLayout";
import HomePage from "../pages/HomePage";
import AboutPage from "../pages/AboutPage";
import ProjectsPage from "../pages/ProjectsPage";
import ContactPage from "../pages/ContactPage";
import BlogPage from "../pages/BlogPage";
import BlogPostPage from "../pages/BlogPostPage";
import RecipesPage from "../pages/RecipesPage";
import RecipePage from "../pages/RecipePage";
import RecipeEditorPage from "../pages/RecipeEditorPage";
import RecipeThemePage from "../pages/RecipeThemePage";
import MadkurvPage from "../pages/MadkurvPage";
import RecipeImportsPage from "../pages/RecipeImportsPage";
import SignupPage from "../pages/SignupPage";

export const router = createBrowserRouter([
    {
        path: "/",
        element: <AppLayout />,
        children: [
            { index: true, element: <HomePage /> },
            { path: "about", element: <AboutPage /> },
            { path: "projects", element: <ProjectsPage /> },
            { path: "blog", element: <BlogPage /> },
            { path: "blog/:slug", element: <BlogPostPage /> },
            { path: "contact", element: <ContactPage /> },
            { path: "opskrifter", element: <RecipesPage /> },
            { path: "opskrifter/ny", element: <RecipeEditorPage /> },
            { path: "opskrifter/generering", element: <RecipeImportsPage /> },
            { path: "opskrifter/tema/:cuisine", element: <RecipeThemePage /> },
            { path: "opskrifter/:slug", element: <RecipePage /> },
            { path: "opskrifter/:slug/rediger", element: <RecipeEditorPage /> },
            { path: "madkurv", element: <MadkurvPage /> },
            { path: "madkurv/:tab", element: <MadkurvPage /> },
            { path: "tilmeld", element: <SignupPage /> },
        ],
    },
]);
