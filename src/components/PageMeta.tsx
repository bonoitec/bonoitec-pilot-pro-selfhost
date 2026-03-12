import { useEffect } from "react";
import { useLocation } from "react-router-dom";

interface PageMetaProps {
  title: string;
  description: string;
}

const BASE_URL = "https://bonoitecpilot.fr";

const PageMeta = ({ title, description }: PageMetaProps) => {
  const { pathname } = useLocation();

  useEffect(() => {
    document.title = title;

    const setMeta = (name: string, content: string, attr = "name") => {
      let el = document.querySelector(`meta[${attr}="${name}"]`) as HTMLMetaElement | null;
      if (!el) {
        el = document.createElement("meta");
        el.setAttribute(attr, name);
        document.head.appendChild(el);
      }
      el.setAttribute("content", content);
    };

    setMeta("description", description);
    setMeta("og:title", title, "property");
    setMeta("og:description", description, "property");
    setMeta("og:url", `${BASE_URL}${pathname}`, "property");
    setMeta("twitter:title", title, "name");
    setMeta("twitter:description", description, "name");

    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.setAttribute("rel", "canonical");
      document.head.appendChild(canonical);
    }
    canonical.setAttribute("href", `${BASE_URL}${pathname}`);

    return () => {
      document.title = "BonoitecPilot – Logiciel de gestion pour atelier de réparation";
    };
  }, [title, description, pathname]);

  return null;
};

export default PageMeta;
