import { Outlet } from "react-router-dom";
import Header from "./Header";
import Footer from "./Footer";
import AnimatedBackground from "./AnimatedBackground";

export default function AppLayout() {
    return (
        <div className="app-shell">
            <AnimatedBackground />
            <Header />
            <main style={{ flex: 1 }}>
                <Outlet />
            </main>
            <Footer />
        </div>
    );

}
