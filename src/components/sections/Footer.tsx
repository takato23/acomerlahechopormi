import { Mail, Twitter, Instagram, Facebook } from "lucide-react";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  const socialLinks = {
    twitter: "#",
    instagram: "#",
    facebook: "#",
    email: "mailto:contacto@acomerla.app",
  };

  return (
    <footer id="footer" className="w-full py-8 border-t border-border bg-muted">
      <div className="container px-4 md:px-6 flex flex-col md:flex-row justify-between items-center text-sm">
        <p className="text-muted-foreground mb-4 md:mb-0">
          © {currentYear} A Comerla. Todos los derechos reservados.
        </p>
        <div className="flex space-x-4">
          {/* Añadir efectos hover a los iconos sociales */}
          <a href={socialLinks.twitter} aria-label="Twitter" className="text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110">
            <Twitter className="h-5 w-5" />
          </a>
          <a href={socialLinks.instagram} aria-label="Instagram" className="text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110">
            <Instagram className="h-5 w-5" />
          </a>
          <a href={socialLinks.facebook} aria-label="Facebook" className="text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110">
            <Facebook className="h-5 w-5" />
          </a>
          <a href={socialLinks.email} aria-label="Email" className="text-muted-foreground transition-all duration-200 hover:text-foreground hover:scale-110">
            <Mail className="h-5 w-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;