import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ isOpen, onClose }) {
  const pathname = usePathname();

  const links = [
    { href: '/dashboard', label: 'Dashboard', icon: '📊' },
    { href: '/customers', label: 'Clientes', icon: '👥' },
    { href: '/quotations', label: 'Orçamentos', icon: '📝' },
    { href: '/service-orders', label: 'Ordens de Serviço', icon: '🔧' },
    { href: '/payments', label: 'Pagamentos', icon: '💰' },
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-20 md:hidden" 
          onClick={onClose}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside className={`
        fixed top-0 left-0 z-30 w-64 h-screen bg-primary transition-transform duration-300 ease-in-out md:translate-x-0 md:static md:h-auto md:min-h-screen
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-center h-16 bg-[#0a1929] border-b border-[#1f364d]">
          <h1 className="text-xl font-bold text-white tracking-wider">CLICK<span className="text-secondary">MARIDO</span></h1>
        </div>

        <div className="py-4 px-3 overflow-y-auto">
          <ul className="space-y-2">
            {links.map((link) => {
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              
              return (
                <li key={link.href}>
                  <Link 
                    href={link.href}
                    onClick={() => { if(window.innerWidth < 768) onClose(); }}
                    className={`flex items-center p-2 rounded-lg transition-colors
                      ${isActive 
                        ? 'bg-secondary text-white' 
                        : 'text-gray-300 hover:bg-[#1f364d] hover:text-white'
                      }`}
                  >
                    <span className="text-xl mr-3">{link.icon}</span>
                    <span className="font-medium">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      </aside>
    </>
  );
}
