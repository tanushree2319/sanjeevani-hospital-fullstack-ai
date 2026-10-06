type PageHeaderProps = {
  title: string;
  subtitle: string;
};

export default function PageHeader({ title, subtitle }: PageHeaderProps) {
  return (
    <section className="py-5 bg-light text-center page-header">
      <div className="container">
        <h1 className="display-6 fw-bold">{title}</h1>
        <p className="text-muted">{subtitle}</p>
      </div>
    </section>
  );
}
