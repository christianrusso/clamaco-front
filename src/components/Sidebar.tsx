'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const pathname = usePathname();

  // Función para verificar si un enlace está activo
  const isActive = (path: string) => {
    return pathname === path;
  };

  // Enlaces de navegación
  const navLinks = [
    { href: '/obras', label: 'Mis Obras' },
    { href: '/contacto', label: 'Contacto' }
  ];

  return (
    <div className="w-56 bg-white shadow-md">
      <div className="py-6 px-4">
        <nav>
          <ul className="space-y-2">
            {navLinks.map((link) => (
              <li key={link.href}>
                <Link 
                  href={link.href} 
                  className={`block py-2 px-4 rounded-md transition-colors ${
                    isActive(link.href)
                      ? 'bg-[#E5E0D5] text-[#4B4B27] font-medium'
                      : 'hover:bg-[#E5E0D5] text-gray-700 hover:text-[#4B4B27]'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
}