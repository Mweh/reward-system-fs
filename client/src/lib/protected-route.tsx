import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";
import { Redirect, Route } from "wouter";

export function ProtectedRoute({
  path,
  component: Component,
}: {
  path: string;
  component: () => React.JSX.Element;
}) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Route path={path}>
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Route>
    );
  }

  if (!user) {
    return (
      <Route path={path}>
        <Redirect to="/auth" />
      </Route>
    );
  }
  
  console.log(`Protected route check - Path: ${path}, User:`, user);
  console.log(`User admin status:`, user.data?.isAdmin);
  
  // Check if user is admin trying to access regular dashboard or vice versa
  if (path === "/admin" && !user.data?.isAdmin) {
    console.log("Non-admin user trying to access admin route - redirecting to /");
    return (
      <Route path={path}>
        <Redirect to="/" />
      </Route>
    );
  }
  
  if (path === "/" && user.data?.isAdmin) {
    console.log("Admin user trying to access regular user route - redirecting to /admin");
    return (
      <Route path={path}>
        <Redirect to="/admin" />
      </Route>
    );
  }

  return <Route path={path} component={Component} />;
}
