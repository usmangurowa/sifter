interface PageHeaderProps {
  title: string;
  description: string;
}

/**
 * Reusable page header component for dashboard pages.
 * Renders a consistent title and description layout.
 */
export const PageHeader = ({ title, description }: PageHeaderProps) => (
  <div className="mb-8">
    <h1 className="text-3xl font-bold tracking-tight">{title}</h1>
    <p className="text-muted-foreground mt-1">{description}</p>
  </div>
);
