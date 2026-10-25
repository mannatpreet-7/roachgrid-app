import {
  BrowserRouter,
  HashRouter,
  Routes,
  Route,
  Link,
} from "react-router-dom";
import { AppProvider } from "./context/AppContext";
import { ErrorBoundary } from "./components/UI";
import Layout from "./components/layout/Layout";
import Home from "./pages/Home";
import Explore from "./pages/Explore";
import Culture from "./pages/Culture";
import Updates from "./pages/Updates";
import Profile from "./pages/Profile";
const Router =
  import.meta.env.VITE_STATIC_PREVIEW === "true" ? HashRouter : BrowserRouter;
export default function App() {
  return (
    <ErrorBoundary>
      <Router>
        <AppProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="explore" element={<Explore />} />
              <Route path="culture" element={<Culture />} />
              <Route path="updates" element={<Updates />} />
              <Route path="profile" element={<Profile />} />
              <Route
                path="*"
                element={
                  <>
                    <h1>This corner isn’t on the grid.</h1>
                    <Link className="button" to="/">
                      Back to overview
                    </Link>
                  </>
                }
              />
            </Route>
          </Routes>
        </AppProvider>
      </Router>
    </ErrorBoundary>
  );
}
