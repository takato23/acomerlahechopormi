import { Mail, Twitter, Instagram, Facebook, MapPin } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = {
    twitter: "#",
    instagram: "#",
    facebook: "#",
    email: "mailto:contacto@acomerla.app",
  };

  return (
    <footer id="footer" className="bg-studio-trufa text-white">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 sm:px-6 md:grid-cols-3">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/70">
            A Comerla Food Studio
          </div>
          <p className="font-display text-2xl leading-tight">
            SaaS premium para estudios gastronómicos, hospitality y retail gourmet.
          </p>
          <p className="text-xs text-white/70">
            Todas las métricas comunicadas son hipótesis en validación con pilotos privados.
          </p>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <h3 className="font-semibold text-white">Contacto studio</h3>
          <p className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-white/60" />
            Operamos remote-first desde CDMX, Buenos Aires y Madrid.
          </p>
          <a href={socialLinks.email} className="inline-flex items-center gap-2 text-white hover:text-studio-miel">
            <Mail className="h-4 w-4" /> contacto@acomerla.app
          </a>
          <div className="flex gap-4 pt-2">
            <a href={socialLinks.twitter} aria-label="Twitter" className="text-white/70 transition hover:text-white">
              <Twitter className="h-5 w-5" />
            </a>
            <a href={socialLinks.instagram} aria-label="Instagram" className="text-white/70 transition hover:text-white">
              <Instagram className="h-5 w-5" />
            </a>
            <a href={socialLinks.facebook} aria-label="Facebook" className="text-white/70 transition hover:text-white">
              <Facebook className="h-5 w-5" />
            </a>
          </div>
        </div>
        <div className="space-y-3 text-sm text-white/80">
          <h3 className="font-semibold text-white">Próximos pasos</h3>
          <ul className="space-y-2">
            <li>• Agenda demo guiada (producto)</li>
            <li>• Solicita kit de marca completo</li>
            <li>• Revisa checklist legal & compliance</li>
          </ul>
          <p className="text-xs text-white/70">
            © {currentYear} A Comerla. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
