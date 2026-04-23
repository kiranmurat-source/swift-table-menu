import { Helmet } from "react-helmet-async";

const SpaShell = () => (
  <Helmet>
    <title>Menü | Tabbled</title>
    <meta name="robots" content="noindex" />
    <meta name="description" content="Menü yükleniyor..." />
    <meta property="og:title" content="Menü | Tabbled" />
    <meta property="og:description" content="Menü yükleniyor..." />
    <meta name="twitter:title" content="Menü | Tabbled" />
    <meta name="twitter:description" content="Menü yükleniyor..." />
  </Helmet>
);

export default SpaShell;
