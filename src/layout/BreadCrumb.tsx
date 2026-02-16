import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation, useMatches } from "react-router";
import { navigationItems } from "./navigation";

const labelMap = navigationItems.reduce<Record<string, string>>((acc, item) => {
  acc[item.to] = item.label;
  return acc;
}, {});

type BreadcrumbItem = {
  label: string;
  to?: string;
};

type BreadcrumbHandle = {
  breadcrumb?: BreadcrumbItem[];
};

const BreadCrumb = () => {
  const location = useLocation();
  const matches = useMatches();

  const matchedRouteWithBreadcrumb = [...matches].reverse().find((match) => {
    const handle = match.handle as BreadcrumbHandle | undefined;
    return Array.isArray(handle?.breadcrumb) && handle.breadcrumb.length > 0;
  });

  const routeCrumbs = (
    (matchedRouteWithBreadcrumb?.handle as BreadcrumbHandle | undefined)
      ?.breadcrumb ?? []
  ).filter((crumb): crumb is BreadcrumbItem => Boolean(crumb?.label));

  const segments = location.pathname.split("/").filter(Boolean);

  const fallbackCrumbs = segments.map((segment, index) => {
    const to = `/${segments.slice(0, index + 1).join("/")}`;
    const label = labelMap[to] ?? segment.replace(/-/g, " ");

    return { to, label };
  });
  const crumbs = routeCrumbs.length ? routeCrumbs : fallbackCrumbs;

  return (
    <Breadcrumbs aria-label="breadcrumb" sx={{ mb: 2 }}>
      <Link
        underline="hover"
        component={RouterLink}
        color="text.primary"
        to="/"
      >
        Panel
      </Link>
      {crumbs.map((crumb, idx) => {
        const key = `${crumb.to ?? crumb.label}-${idx}`;
        const isLast = idx === crumbs.length - 1;
        if (isLast || !crumb.to) {
          return (
            <Typography key={key} color="text.secondary">
              {crumb.label}
            </Typography>
          );
        }

        return (
          <Link
            key={key}
            underline="hover"
            component={RouterLink}
            color="text.primary"
            to={crumb.to}
          >
            {crumb.label}
          </Link>
        );
      })}
    </Breadcrumbs>
  );
};

export default BreadCrumb;
