import { Switch, Route, useLocation, Redirect } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { Loader2 } from "lucide-react";
import Home from "@/pages/home";
import NotFound from "@/pages/not-found";
import WidgetEmbed from "@/pages/widget-embed";
// New unified dashboard pages
import DashboardPage from "@/pages/dashboard/index";
import IntegrationPage from "@/pages/dashboard/integration";
import AnalyticsPage from "@/pages/dashboard/analytics";
import SettingsPage from "@/pages/dashboard/settings";
// Documentation pages
import DocsIndex from "@/pages/docs/index";
import DocsAPI from "@/pages/docs/api";
import DocsQuickstart from "@/pages/docs/quickstart";
import DocsAuthentication from "@/pages/docs/authentication";
import DocsWidgetInstallation from "@/pages/docs/widget/installation";
import DocsWidgetConfiguration from "@/pages/docs/widget/configuration";
import DocsWidgetCustomization from "@/pages/docs/widget/customization";
import DocsAPISessions from "@/pages/docs/api/sessions";
import DocsAPITryOn from "@/pages/docs/api/try-on";
import DocsAPIWebhooks from "@/pages/docs/api/webhooks";
import DocsPlatformsShopify from "@/pages/docs/platforms/shopify";
import DocsPlatformsWooCommerce from "@/pages/docs/platforms/woocommerce";
import DocsPlatformsReact from "@/pages/docs/platforms/react";
import BlogIndex from "@/pages/blog/index";
import TechnologyPage from "@/pages/technology";

// Home route that redirects authenticated users to dashboard
function HomeRoute() {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Redirect to="/dashboard" />;
  }

  return <Home />;
}

function Router() {
  const { isLoading, isAuthenticated } = useAuth();
  const [location] = useLocation();

  // Widget embed page doesn't need auth - render directly
  if (location.startsWith("/widget/embed")) {
    return <WidgetEmbed />;
  }

  // Show loading spinner while checking authentication for other pages
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={HomeRoute} />

      {/* Unified Dashboard Routes */}
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/dashboard/integration" component={IntegrationPage} />
      <Route path="/dashboard/analytics" component={AnalyticsPage} />
      <Route path="/dashboard/settings" component={SettingsPage} />

      {/* Redirect old merchant routes to new unified dashboard */}
      <Route path="/merchant/dashboard">
        <Redirect to="/dashboard" />
      </Route>
      <Route path="/merchant/integration">
        <Redirect to="/dashboard/integration" />
      </Route>
      <Route path="/merchant/analytics">
        <Redirect to="/dashboard/analytics" />
      </Route>
      <Route path="/merchant/settings">
        <Redirect to="/dashboard/settings" />
      </Route>
      <Route path="/merchant/login">
        <Redirect to="/" />
      </Route>
      <Route path="/merchant/register">
        <Redirect to="/" />
      </Route>
      <Route path="/merchant">
        <Redirect to="/dashboard" />
      </Route>

      {/* Documentation routes - most specific first */}
      <Route path="/docs/widget/installation" component={DocsWidgetInstallation} />
      <Route path="/docs/widget/configuration" component={DocsWidgetConfiguration} />
      <Route path="/docs/widget/customization" component={DocsWidgetCustomization} />
      <Route path="/docs/api/sessions" component={DocsAPISessions} />
      <Route path="/docs/api/try-on" component={DocsAPITryOn} />
      <Route path="/docs/api/webhooks" component={DocsAPIWebhooks} />
      <Route path="/docs/platforms/shopify" component={DocsPlatformsShopify} />
      <Route path="/docs/platforms/woocommerce" component={DocsPlatformsWooCommerce} />
      <Route path="/docs/platforms/react" component={DocsPlatformsReact} />
      <Route path="/docs/quickstart" component={DocsQuickstart} />
      <Route path="/docs/authentication" component={DocsAuthentication} />
      <Route path="/docs/api" component={DocsAPI} />
      <Route path="/docs" component={DocsIndex} />
      {/* Other routes */}
      <Route path="/blog" component={BlogIndex} />
      <Route path="/technology" component={TechnologyPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
