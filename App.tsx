
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, ShoppingCart, User, Plus, Minus, Trash2, RefreshCw, AlertCircle, ShieldAlert, Clock } from 'lucide-react';
import AccessGate from './components/AccessGate';
import ProductCard from './components/ProductCard';
import CheckoutFlow from './components/CheckoutFlow';
import { Product, CartItem } from './types';
import { API_URL } from './constants';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [userPhone, setUserPhone] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cajoneraEstado, setCajoneraEstado] = useState<'ABIERTO' | 'CERRADO'>('ABIERTO');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Verificar si el usuario ya pagó su entrada hoy
    const savedName = localStorage.getItem('la_cajonera_user');
    const savedPhone = localStorage.getItem('la_cajonera_phone');
    const lastAccessDate = localStorage.getItem('la_cajonera_date');
    const today = new Date().toDateString();

    if (savedName && savedPhone && lastAccessDate === today) {
      setUserName(savedName);
      setUserPhone(savedPhone);
    }
    
    fetchData();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch(API_URL, { 
        method: 'GET',
        cache: 'no-store' 
      });
      
      const data = await response.json();
      
      if (data.status === 'error') {
        throw new Error(data.message);
      }

      setCajoneraEstado(data.estado || 'ABIERTO');
      setProducts(data.products || []);
      
    } catch (error: any) {
      console.error('Fetch Error:', error);
      setConnectionError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const grantAccess = (name: string, phone: string) => {
    const today = new Date().toDateString();
    localStorage.setItem('la_cajonera_user', name);
    localStorage.setItem('la_cajonera_phone', phone);
    localStorage.setItem('la_cajonera_date', today);
    setUserName(name);
    setUserPhone(phone);
  };

  const logout = () => {
    if (confirm('¿Cerrar sesión? Tendrás que volver a registrarte.')) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const addToCart = (product: Product) => {
    const available = (Number(product.meta_stock) || 0) - (Number(product.vendidos_actual) || 0);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > available) {
        alert(`¡Casero! Solo quedan ${available} unidades.`);
        return prev;
      }
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | number, delta: number) => {
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      return prev.map(item => {
        if (item.id === id) {
          const newQty = Math.max(0, item.quantity + delta);
          return { ...item, quantity: newQty };
        }
        return item;
      }).filter(item => item.quantity > 0);
    });
  };

  const cartTotal = useMemo(() => cart.reduce((acc, item) => acc + (Number(item.precio) * item.quantity), 0), [cart]);
  const cartCount = useMemo(() => cart.reduce((acc, item) => acc + item.quantity, 0), [cart]);

  const filteredProducts = products.filter(p => p.nombre?.toLowerCase().includes(searchTerm.toLowerCase()));

  // 1. Muro de Pago/Registro
  if (!userName) return <AccessGate onAccessGranted={grantAccess} />;

  // 2. Estado de Cajonera Cerrada
  if (cajoneraEstado === 'CERRADO' && !isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-8 text-center">
        <div className="bg-white p-10 rounded-[3rem] shadow-xl border border-gray-100 max-w-sm">
          <div className="bg-amber-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
            <Clock size={48} className="text-amber-600 animate-pulse" />
          </div>
          <h2 className="text-2xl font-black text-gray-800 mb-2 italic">Lote Cerrado</h2>
          <p className="text-gray-500 text-sm leading-relaxed mb-8">
            ¡Casero! La cajonera de hoy ha finalizado o aún no ha empezado. El administrador abrirá el catálogo pronto.
          </p>
          <button 
            onClick={fetchData}
            className="w-full bg-indigo-600 text-white py-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2"
          >
            <RefreshCw size={18} /> Reintentar
          </button>
        </div>
      </div>
    );
  }

  // 3. Vista de Checkout
  if (isCheckoutView) {
    return (
      <CheckoutFlow 
        userName={userName} 
        cart={cart} 
        total={cartTotal} 
        onBack={() => setIsCheckoutView(false)} 
        onSuccess={() => {
          setCart([]);
          setIsCheckoutView(false);
          setIsCartOpen(false);
          fetchData();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-indigo-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-md">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <h1 className="font-black text-xl tracking-tighter italic text-indigo-900 uppercase">La Cajonera</h1>
        </div>
        <button onClick={logout} className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100">
           <span className="text-[10px] font-bold text-gray-500 uppercase">{userName.split(' ')[0]}</span>
           <User size={16} className="text-indigo-600" />
        </button>
      </header>

      <div className="p-4 flex-grow">
        <div className="bg-indigo-600 rounded-[2rem] p-6 text-white shadow-xl mb-6 relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-black italic mb-1 uppercase tracking-tighter">¡Remate de Hoy! 🚀</h2>
            <p className="text-indigo-100 text-xs mb-4 uppercase font-bold tracking-widest opacity-80">Solo para miembros registrados</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
              <input 
                type="text"
                placeholder="¿Qué buscas hoy?"
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-11 pr-4 placeholder:text-indigo-200 focus:bg-white focus:text-gray-900 focus:outline-none transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        </div>

        {connectionError ? (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <p className="text-gray-500 font-bold mb-6 italic">Problema de conexión con la base de datos.</p>
            <button onClick={fetchData} className="bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold">Reintentar</button>
          </div>
        ) : (
          <div className="mb-24">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-black text-gray-800 text-lg uppercase tracking-tighter italic">Ofertas Disponibles</h3>
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-3xl h-64 animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
                <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-bold italic">No hay nada por aquí...</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} onAddToCart={addToCart} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {cartCount > 0 && !isCartOpen && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-5 rounded-[2rem] shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-500 z-40 border-4 border-white active:scale-95 transition-transform"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-indigo-600">
              {cartCount}
            </span>
          </div>
          <span className="font-black italic tracking-tighter uppercase">Ver Carrito</span>
          <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-black">S/ {cartTotal.toFixed(2)}</span>
        </button>
      )}

      {/* Drawer del Carrito Simbolizado */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 rounded-l-[3rem] overflow-hidden">
            <div className="p-8 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-2xl font-black italic flex items-center gap-2 text-indigo-900 uppercase tracking-tighter">
                <ShoppingCart className="text-indigo-600" /> Mi Compra
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full shadow-sm">
                <Plus className="rotate-45 text-gray-400" size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-6 space-y-4">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-3xl border border-gray-100 shadow-sm">
                  <div className="w-16 h-16 rounded-2xl overflow-hidden bg-gray-100 shrink-0 border border-gray-50">
                    <img src={item.imagen_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-xs text-gray-800 line-clamp-1">{item.nombre}</h4>
                    <p className="text-indigo-600 font-black text-sm italic">S/ {Number(item.precio).toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-100"><Minus size={14} /></button>
                      <span className="text-sm font-black w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 bg-gray-50 rounded-xl flex items-center justify-center text-gray-500 border border-gray-100"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-200 hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={20} />
                  </button>
                </div>
              ))}
            </div>

            <div className="p-8 border-t bg-gray-50/50">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">Subtotal de productos</p>
                  <p className="text-4xl font-black text-gray-900 italic tracking-tighter">S/ {cartTotal.toFixed(2)}</p>
                </div>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutView(true)}
                className="w-full bg-indigo-600 text-white py-5 rounded-[2rem] font-black text-xl italic uppercase tracking-tighter shadow-xl shadow-indigo-100 active:scale-95 transition-transform"
              >
                Confirmar Pedido
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
