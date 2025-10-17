// src/components/sections/Navbar.tsx
import { Button } from "@/components/ui/button";
import { Menu, Sun, Moon, LogOut, Home, BookOpen, ShoppingBasket, CalendarDays, User, ListChecks, Monitor } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { useTheme } from "@/context/ThemeContext";
import { useAuth } from "@/features/auth/AuthContext";
import { Link, useLocation, NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";
import React from "react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Links para Landing Page con tipo explícito
interface LandingNavItem { name: string; href: string; }
const landingNavigation: LandingNavItem[] = [
  { name: "Inicio", href: "#hero" },
  { name: "Catálogo", href: "#catalogo" },
  { name: "Testimonios", href: "#testimonios" },
  { name: "Demo Interactiva", href: "#demo" },
  { name: "FAQ", href: "#faq" },
];
// Links para App (consistente con Sidebar y BottomNav) - Sincronizado
const appNavigation = [
  { name: 'Dashboard', href: '/app', icon: Home, exact: true },
  { name: 'Recetas', href: '/app/recipes', icon: BookOpen },
  { name: 'Despensa', href: '/app/pantry', icon: ShoppingBasket },
  { name: 'Planificación', href: '/app/planning', icon: CalendarDays },
  { name: 'Lista Compras', href: '/app/shopping-list', icon: ListChecks },
  { name: 'Perfil', href: '/app/profile', icon: User },
];

// Función helper para scroll suave (solo necesaria en landing)
const scrollToSection = (id: string) => {
  const section = document.getElementById(id.substring(1));
  section?.scrollIntoView({ behavior: 'smooth' });
};

const Navbar = () => {
  const { theme, setTheme } = useTheme();
  const { user, logout, loading } = useAuth();
  const location = useLocation();

  const isLandingPage = location.pathname === '/';
  const isAppPage = location.pathname.startsWith('/app'); // Necesario para estilo condicional

  const showUserElements = !loading && !!user;

  // const toggleMobileMenu = () => { ... }; // Ya no es necesario

  // Click para links de scroll en landing
  const handleLandingLinkClick = (id: string) => {
    // Solo hacer scroll si estamos en la landing page
    if (isLandingPage) {
      scrollToSection(id);
    } else {
      // Si estamos en /app, navegar a la landing con el hash
      window.location.href = `/${id}`;
    }
    // setMobileMenuOpen(false); // Ya no es necesario, SheetClose lo maneja
  };

  // Click para links de scroll en landing (desktop)
  const handleLandingNavClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    // Solo hacer scroll si estamos en la landing page
    if (isLandingPage) {
      scrollToSection(id);
    } else {
       // Si estamos en /app, navegar a la landing con el hash
      window.location.href = `/${id}`;
    }
  };

  return (
    <nav className="sticky top-0 left-0 right-0 z-50 border-b border-studio-neblina/60 bg-white/80 backdrop-blur-xl transition-colors">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Logo Simple */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-primary to-accent rounded-xl flex items-center justify-center">
              <span className="text-white text-lg font-bold">🍳</span>
            </div>
            <Link to={user ? "/app" : "/"} className="text-xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              A Comerla
            </Link>
          </div>

          {/* Links de navegación - Desktop (SOLO LANDING) */}
          {isLandingPage && (
            <div className="hidden md:flex md:items-center md:space-x-6 lg:space-x-8">
              {landingNavigation.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  onClick={(e) => handleLandingNavClick(e, item.href)}
                  className="text-sm font-medium text-foreground/80 transition-all duration-200 hover:text-foreground hover:-translate-y-0.5"
                >
                  {item.name}
                </a>
              ))}
            </div>
          )}

          {/* Navegación principal de la App (Desktop) */}
          {isAppPage && showUserElements && (
            <div className="hidden md:flex md:items-center md:space-x-2 lg:space-x-4 flex-grow justify-center">
              {appNavigation.map((item) => (
                <NavLink
                  key={item.name}
                  to={item.href}
                  end={item.exact}
                  className={({ isActive }: { isActive: boolean }) => cn(
                    'text-sm font-medium text-foreground/80 transition-modern hover:text-foreground px-3 py-2 rounded-xl relative overflow-hidden group',
                    isActive
                      ? 'bg-gradient-primary text-white shadow-glow scale-105'
                      : 'hover:bg-card/60 hover:shadow-card-modern'
                  )}
                >
                  {/* Efecto shimmer sutil */}
                  <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-500" />
                  <span className="relative z-10">{item.name}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Espaciador si no es landing page Y NO es app page con usuario (caso raro, pero por si acaso) */}
          {!isLandingPage && !(isAppPage && showUserElements) && <div className="flex-grow"></div>}

          {/* Botones de Acción y Menú Móvil */}
          <div className="flex items-center">
            {/* Acciones de Usuario (si logueado) */}
            {showUserElements && (
              <>
                <span className="text-sm text-muted-foreground mr-3 hidden sm:inline">
                  {user?.email} {/* Optional chaining */}
                </span>
                <Button variant="ghost" size="icon" onClick={logout} className="mr-3 transition-transform duration-200 hover:scale-110">
                  <LogOut className="h-5 w-5" />
                  <span className="sr-only">Cerrar sesión</span>
                </Button>
              </>
            )}

            {/* Botón Login (si no logueado y no cargando) */}
            {!showUserElements && !loading && (
              <Link to="/login">
                <Button
                  variant="default"
                  size="sm"
                  className="mr-3 transition-transform duration-200 hover:scale-105"
                >
                  Login
                </Button>
              </Link>
            )}

            {/* Botón Cambio de Tema Mejorado con Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="mr-3 transition-smooth hover:scale-105">
                  <Sun className="h-5 w-5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-5 w-5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Cambiar tema</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem onClick={() => setTheme('light')} className="cursor-pointer">
                  <Sun className="mr-2 h-4 w-4" />
                  <span>Claro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('dark')} className="cursor-pointer">
                  <Moon className="mr-2 h-4 w-4" />
                  <span>Oscuro</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTheme('system')} className="cursor-pointer">
                  <Monitor className="mr-2 h-4 w-4" />
                  <span>Sistema</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            {/* Botón Hamburguesa con Sheet Trigger - Solo visible en móvil */}
            <div className="md:hidden"> {/* Contenedor para aplicar md:hidden */}
              <Sheet>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="icon" aria-label="Abrir menú">
                    <Menu className="h-6 w-6" />
                  </Button>
                </SheetTrigger>
                {/* Contenido del Sheet (Menú Lateral) */}
                <SheetContent side="left" className="w-72 p-4"> {/* Ajustar ancho y padding */}
                  <SheetHeader className="mb-6 text-left">
                    <SheetTitle>
                       <Link to={user ? "/app" : "/"} className="text-xl font-bold text-primary">
                         A Comerla
                       </Link>
                    </SheetTitle>
                  </SheetHeader>
                  <nav className="flex flex-col space-y-1">
                    {/* Mostrar links de App si está logueado */}
                    {showUserElements && appNavigation.map((item) => (
                      <SheetClose asChild key={item.name}>
                        <NavLink
                          to={item.href}
                          end={item.exact}
                          className={({ isActive }: { isActive: boolean }) => cn( // Añadir tipo a isActive
                            'flex items-center gap-3 rounded-md px-3 py-2 text-base font-medium transition-colors', // text-base para móvil
                            isActive
                              ? 'bg-primary/10 text-primary'
                              : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                          )}
                        >
                          <item.icon className="h-5 w-5 flex-shrink-0" />
                          <span>{item.name}</span>
                        </NavLink>
                      </SheetClose>
                    ))}
                    {/* Mostrar links de Landing si está en Landing */}
                    {isLandingPage && landingNavigation.map((item) => (
                       <SheetClose asChild key={item.name}>
                         <a
                           href={item.href}
                           onClick={() => handleLandingLinkClick(item.href)} // Usar handler existente
                           className="block rounded-md px-3 py-2 text-base font-medium text-foreground/80 hover:bg-muted hover:text-foreground transition-colors duration-200"
                         >
                           {item.name}
                         </a>
                       </SheetClose>
                    ))}

                    {/* Separador y Acciones */}
                    <hr className="my-4 border-border" />

                    {/* Botón Login/Logout Móvil */}
                    {showUserElements ? (
                      <SheetClose asChild>
                        <Button variant="ghost" size="sm" onClick={logout} className="w-full mt-2 flex items-center justify-start gap-2 px-3"> {/* Alinear a la izquierda */}
                          <LogOut className="h-4 w-4" /> Cerrar sesión
                        </Button>
                      </SheetClose>
                    ) : !loading ? (
                      <SheetClose asChild>
                        <Link to="/login" className="w-full">
                          <Button variant="default" size="sm" className="w-full mt-2">
                            Login / Signup
                          </Button>
                        </Link>
                      </SheetClose>
                    ) : null}

                    {/* Selector Tema Móvil */}
                    <div className="mt-4 space-y-1">
                      <p className="text-xs font-medium text-muted-foreground px-3 py-1">Tema</p>
                      <SheetClose asChild>
                        <Button 
                          variant={theme === 'light' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          onClick={() => setTheme('light')} 
                          className="w-full justify-start gap-2"
                        >
                          <Sun className="h-4 w-4" />
                          Claro
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant={theme === 'dark' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          onClick={() => setTheme('dark')} 
                          className="w-full justify-start gap-2"
                        >
                          <Moon className="h-4 w-4" />
                          Oscuro
                        </Button>
                      </SheetClose>
                      <SheetClose asChild>
                        <Button 
                          variant={theme === 'system' ? 'secondary' : 'ghost'} 
                          size="sm" 
                          onClick={() => setTheme('system')} 
                          className="w-full justify-start gap-2"
                        >
                          <Monitor className="h-4 w-4" />
                          Sistema
                        </Button>
                      </SheetClose>
                    </div>
                  </nav>
                </SheetContent>
              </Sheet>
            </div>
          </div>
        </div>
      </div>

      {/* Ya no se necesita el menú desplegable antiguo */}
    </nav>
  );
};

export default Navbar;
