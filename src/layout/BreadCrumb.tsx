import { Breadcrumbs, Link, Typography } from "@mui/material";
import { Link as RouterLink, useLocation } from "react-router";
import { navigationItems } from "./navigation";

const labelMap = navigationItems.reduce<Record<string, string>>((acc, item) => {
  acc[item.to] = item.label;
  return acc;
}, {});

const BreadCrumb = () => {
  const location = useLocation();
  const segments = location.pathname.split("/").filter(Boolean);

  const crumbs = segments.map((segment, index) => {
    const to = `/${segments.slice(0, index + 1).join("/")}`;
    const label = labelMap[to] ?? segment.replace(/-/g, " ");

    return { to, label };
  });

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
      {crumbs.map((crumb, idx) =>
        idx === crumbs.length - 1 ? (
          <Typography key={crumb.to} color="text.secondary">
            {crumb.label}
          </Typography>
        ) : (
          <Link
            key={crumb.to}
            underline="hover"
            component={RouterLink}
            color="text.primary"
            to={crumb.to}
          >
            {crumb.label}
          </Link>
        )
      )}
    </Breadcrumbs>
  );
};

export default BreadCrumb;
