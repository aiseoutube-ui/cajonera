
import React, { useState, useEffect, useMemo } from 'react';
import { ShoppingBag, Search, ShoppingCart, User, Plus, Minus, Trash2, RefreshCw, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import WelcomeModal from './components/WelcomeModal';
import ProductCard from './components/ProductCard';
import CheckoutFlow from './components/CheckoutFlow';
import { Product, CartItem } from './types';
import { API_URL } from './constants';

const App: React.FC = () => {
  const [userName, setUserName] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [connectionError, setConnectionError] = useState<string | null>(null);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutView, setIsCheckoutView] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const savedName = localStorage.getItem('la_cajonera_user');
    if (savedName) setUserName(savedName);
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setIsLoading(true);
    setConnectionError(null);
    try {
      const response = await fetch(API_URL, { 
        method: 'GET',
        cache: 'no-store' 
      });
      
      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const data = await response.json();
      
      if (Array.isArray(data)) {
        setProducts(data);
      } else if (data && data.status === 'error') {
        throw new Error(data.message);
      } else {
        throw new Error('Respuesta inesperada del servidor.');
      }
    } catch (error: any) {
      console.error('Fetch Error:', error);
      let msg = error.message;
      if (msg.includes("ERROR DE PERMISOS") || msg.includes("Unexpected error") || msg.includes("openById")) {
        msg = "AUTORIZACIÓN PENDIENTE: Google bloqueó la conexión automática.";
      }
      setConnectionError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  const saveUser = (name: string) => {
    localStorage.setItem('la_cajonera_user', name);
    setUserName(name);
  };

  const addToCart = (product: Product) => {
    const available = (Number(product.meta_stock) || 0) - (Number(product.vendidos_actual) || 0);
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      const currentQty = existing ? existing.quantity : 0;
      if (currentQty + 1 > available) {
        alert(`¡Casero! Solo quedan ${available} unidades de "${product.nombre}" disponibles.`);
        return prev;
      }
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string | number, delta: number) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    const available = (Number(product.meta_stock) || 0) - (Number(product.vendidos_actual) || 0);
    setCart(prev => {
      const item = prev.find(i => i.id === id);
      if (!item) return prev;
      if (delta > 0 && item.quantity + delta > available) {
        alert(`Solo hay ${available} disponibles.`);
        return prev;
      }
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

  const filteredProducts = Array.isArray(products) 
    ? products.filter(p => p.nombre && p.nombre.toLowerCase().includes(searchTerm.toLowerCase()))
    : [];

  if (!userName) return <WelcomeModal onSave={saveUser} />;

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
          fetchProducts();
        }}
      />
    );
  }

  return (
    <div className="max-w-4xl mx-auto min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white px-4 py-4 shadow-sm flex items-center justify-between sticky top-0 z-30 border-b border-indigo-50">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg shadow-md shadow-indigo-100">
            <ShoppingBag className="text-white" size={20} />
          </div>
          <h1 className="font-bold text-xl tracking-tight text-indigo-900">La Cajonera</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-gray-400 uppercase font-bold leading-none tracking-widest">Casero</p>
            <p className="text-sm font-bold text-gray-700">{userName}</p>
          </div>
          <button 
            onClick={() => { if (confirm('¿Cerrar sesión?')) { localStorage.removeItem('la_cajonera_user'); setUserName(null); } }}
            className="p-2 bg-gray-100 rounded-full text-gray-500 hover:text-red-500 transition-colors"
          >
            <User size={20} />
          </button>
        </div>
      </header>

      <div className="p-4 flex-grow">
        <div className="bg-indigo-600 rounded-3xl p-6 text-white shadow-xl shadow-indigo-100 mb-6 overflow-hidden relative">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold mb-1">¡Juntas Activas! 🚀</h2>
            <p className="text-indigo-100 text-sm mb-4">Aprovecha precios mayoristas en grupo.</p>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
              <input 
                type="text"
                placeholder="¿Qué estás buscando hoy?"
                className="w-full bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl py-3 pl-11 pr-4 placeholder:text-indigo-200 focus:bg-white focus:text-gray-900 focus:outline-none transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
        </div>

        {connectionError ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center animate-in fade-in zoom-in duration-300">
            <div className="bg-orange-50 p-6 rounded-full mb-6 border-2 border-orange-100">
              <ShieldCheck size={48} className="text-orange-500" />
            </div>
            <h3 className="text-xl font-bold text-gray-800 mb-2">Paso de Autorización Requerido</h3>
            
            <div className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm mb-8 max-w-sm text-left">
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Google Apps Script necesita que confirmes los permisos manualmente una vez para este ID de documento.
              </p>
              <div className="space-y-3">
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">1</div>
                  <p className="text-xs text-gray-600">Abre tu editor de <b>Apps Script</b> en Google.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">2</div>
                  <p className="text-xs text-gray-600">En la barra superior, cambia 'doGet' por <b>'setup'</b>.</p>
                </div>
                <div className="flex gap-3 items-start">
                  <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">3</div>
                  <p className="text-xs text-gray-600">Haz clic en <b>Ejecutar</b> y acepta todos los permisos que pida Google.</p>
                </div>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-mono text-gray-400 truncate max-w-[150px]">{API_URL}</span>
                <ExternalLink size={12} className="text-gray-300" />
              </div>
            </div>

            <button 
              onClick={fetchProducts}
              className="flex items-center gap-2 bg-indigo-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
            >
              <RefreshCw size={18} /> Ya lo hice, Reintentar
            </button>
            <p className="mt-4 text-xs text-gray-400 italic">"{connectionError}"</p>
          </div>
        ) : (
          <div className="mb-24">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="font-bold text-gray-800 text-lg">Catálogo de Ofertas</h3>
              {!isLoading && (
                <span className="text-xs font-bold text-indigo-600 bg-indigo-50 px-3 py-1 rounded-full border border-indigo-100">
                  {filteredProducts.length} productos
                </span>
              )}
            </div>
            
            {isLoading ? (
              <div className="grid grid-cols-2 gap-4">
                {[1, 2, 3, 4].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-64 animate-pulse border border-gray-100 shadow-sm"></div>
                ))}
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-3xl border border-gray-100 shadow-sm">
                <AlertCircle size={40} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-400 font-medium">No hay productos activos en este momento.</p>
                <button onClick={fetchProducts} className="text-indigo-600 text-sm font-bold mt-2 underline">Actualizar lista</button>
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

      {cartCount > 0 && !isCartOpen && !connectionError && (
        <button 
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-indigo-600 text-white px-8 py-5 rounded-3xl shadow-2xl flex items-center gap-3 animate-in slide-in-from-bottom-10 duration-500 z-40 border-4 border-white active:scale-95 transition-transform"
        >
          <div className="relative">
            <ShoppingCart size={24} />
            <span className="absolute -top-3 -right-3 bg-red-500 text-white text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-indigo-600">
              {cartCount}
            </span>
          </div>
          <span className="font-bold tracking-tight">Ver Carrito</span>
          <span className="bg-white/20 rounded-lg px-2 py-0.5 text-xs font-black">S/ {cartTotal.toFixed(2)}</span>
        </button>
      )}

      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-gray-900/60 backdrop-blur-md" onClick={() => setIsCartOpen(false)}></div>
          <div className="relative w-full max-w-md bg-white h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300 rounded-l-3xl overflow-hidden">
            <div className="p-6 border-b flex justify-between items-center bg-gray-50/50">
              <h2 className="text-xl font-bold flex items-center gap-2 text-indigo-900">
                <ShoppingCart className="text-indigo-600" /> Tu Carrito
              </h2>
              <button onClick={() => setIsCartOpen(false)} className="p-2 bg-white rounded-full shadow-sm text-gray-400 hover:text-gray-600 transition-colors">
                <Plus className="rotate-45" size={20} />
              </button>
            </div>
            
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 items-center bg-white p-4 rounded-2xl border border-gray-100 shadow-sm transition-all hover:border-indigo-100">
                  <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                    <img src={item.imagen_url} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-grow">
                    <h4 className="font-bold text-sm text-gray-800 line-clamp-1">{item.nombre}</h4>
                    <p className="text-indigo-600 font-bold text-sm">S/ {Number(item.precio).toFixed(2)}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-indigo-600 transition-colors"><Minus size={14} /></button>
                      <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center text-gray-500 hover:bg-white hover:text-indigo-600 transition-colors"><Plus size={14} /></button>
                    </div>
                  </div>
                  <button onClick={() => updateQuantity(item.id, -item.quantity)} className="text-gray-300 hover:text-red-500 p-2 transition-colors">
                    <Trash2 size={18} />
                  </button>
                </div>
              ))}
              {cart.length === 0 && (
                <div className="text-center py-24 text-gray-400">
                  <div className="bg-gray-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 border border-gray-100">
                    <ShoppingCart size={32} className="opacity-20" />
                  </div>
                  <p className="font-medium">Aún no has agregado nada</p>
                </div>
              )}
            </div>

            <div className="p-8 border-t bg-gray-50/50 backdrop-blur-sm">
              <div className="flex justify-between items-end mb-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mb-1">Total del pedido</p>
                  <p className="text-3xl font-bold text-gray-900">S/ {cartTotal.toFixed(2)}</p>
                </div>
              </div>
              <button 
                disabled={cart.length === 0}
                onClick={() => setIsCheckoutView(true)}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg shadow-xl shadow-indigo-100 disabled:bg-gray-300 transition-all active:scale-95"
              >
                Confirmar y Pagar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default App;
