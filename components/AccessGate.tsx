
import React, { useState } from 'react';
import { Copy, CheckCircle2, Loader2, Smartphone, User, MessageCircle } from 'lucide-react';
import { YAPE_NUMBER, ENTRY_FEE, API_URL, ADMIN_PHONE } from '../constants';

interface AccessGateProps {
  onAccessGranted: (name: string, phone: string) => void;
}

const AccessGate: React.FC<AccessGateProps> = ({ onAccessGranted }) => {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isCopied, setIsCopied] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const copyYape = () => {
    navigator.clipboard.writeText(YAPE_NUMBER.replace(/\s/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleRegister = async () => {
    if (!name || !phone) return;
    setIsLoading(true);
    try {
      await fetch(API_URL, {
        method: 'POST',
        body: JSON.stringify({
          action: 'REGISTER_ENTRY',
          userName: name,
          userPhone: phone
        })
      });
      
      const waMsg = `Hola, soy *${name}* (${phone}). Ya yapeé los S/ 2.00 para entrar a la Cajonera de hoy. 🎫`;
      const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMsg)}`;
      
      // Simular éxito y guardar localmente
      onAccessGranted(name, phone);
      window.open(waUrl, '_blank');
    } catch (e) {
      alert("Error de conexión. Intenta de nuevo.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-indigo-900 p-4">
      <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10"></div>
      
      <div className="w-full max-w-sm bg-white rounded-[2.5rem] overflow-hidden shadow-2xl animate-in fade-in zoom-in duration-500 relative z-10">
        <div className="bg-indigo-600 p-8 text-center text-white relative">
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-lg">
            <span className="text-2xl">🎫</span>
          </div>
          <h2 className="text-2xl font-black italic tracking-tighter uppercase">La Cajonera</h2>
          <p className="text-indigo-100 text-xs font-bold mt-1 opacity-80 uppercase tracking-widest">Pase de Acceso Diario</p>
        </div>

        <div className="p-8 pt-10">
          {step === 1 ? (
            <div className="space-y-4 animate-in slide-in-from-bottom duration-300">
              <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Regístrate para ver las ofertas de hoy.</p>
              </div>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Tu nombre completo"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              <div className="relative">
                <Smartphone className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="tel"
                  placeholder="Tu WhatsApp"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-11 pr-4 py-4 bg-gray-50 border-2 border-gray-100 rounded-2xl focus:border-indigo-500 outline-none transition-all font-medium"
                />
              </div>
              <button
                disabled={!name || !phone}
                onClick={() => setStep(2)}
                className="w-full bg-indigo-600 disabled:bg-gray-200 text-white font-black py-5 rounded-2xl shadow-xl shadow-indigo-100 active:scale-95 transition-transform"
              >
                OBTENER PASE (S/ {ENTRY_FEE.toFixed(2)})
              </button>
            </div>
          ) : (
            <div className="animate-in slide-in-from-right duration-300">
              <div className="bg-indigo-50 rounded-3xl p-6 mb-6 text-center border-2 border-indigo-100">
                <p className="text-indigo-900 font-bold mb-3 text-sm italic">"Yapea 2 soles para entrar"</p>
                <div 
                  onClick={copyYape}
                  className="bg-white p-4 rounded-2xl flex items-center justify-between cursor-pointer active:scale-95 transition-transform shadow-sm"
                >
                  <span className="text-xl font-mono font-black text-indigo-600">{YAPE_NUMBER}</span>
                  {isCopied ? <CheckCircle2 className="text-green-500" /> : <Copy className="text-gray-300" size={20} />}
                </div>
                {isCopied && <p className="text-[10px] text-green-600 font-bold mt-2">¡Número copiado!</p>}
              </div>

              <div className="flex gap-2 text-[10px] text-gray-400 mb-6 px-2">
                <div className="shrink-0 bg-amber-100 text-amber-600 p-1 rounded">⚠️</div>
                <p>Al confirmar, te abriremos WhatsApp para que envíes tu voucher. Luego podrás ver todo el catálogo.</p>
              </div>

              <button
                disabled={isLoading}
                onClick={handleRegister}
                className="w-full bg-green-600 text-white font-black py-5 rounded-2xl shadow-xl shadow-green-100 flex items-center justify-center gap-3 active:scale-95 transition-transform"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <><MessageCircle /> YA YAPEÉ, ENTRAR</>}
              </button>
              
              <button 
                onClick={() => setStep(1)}
                className="w-full mt-4 text-gray-400 text-xs font-bold uppercase tracking-widest"
              >
                Volver a mis datos
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AccessGate;
