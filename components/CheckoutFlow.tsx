
import React, { useState } from 'react';
import { CheckCircle2, Copy, Send, Loader2, ArrowLeft, AlertTriangle, MessageCircle } from 'lucide-react';
import { CartItem } from '../types';
import { YAPE_NUMBER, ADMIN_PHONE, API_URL } from '../constants';

interface CheckoutFlowProps {
  userName: string;
  cart: CartItem[];
  total: number;
  onBack: () => void;
  onSuccess: () => void;
}

const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ userName, cart, total, onBack, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [isCopied, setIsCopied] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const copyYape = () => {
    navigator.clipboard.writeText(YAPE_NUMBER.replace(/\s/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const submitOrder = async () => {
    setIsUploading(true);
    setErrorMsg(null);

    try {
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        body: JSON.stringify({
          userName,
          cart,
          total,
          voucherBase64: null // Ya no enviamos imagen
        }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        const orderSummary = cart.map(i => `${i.quantity}x ${i.nombre}`).join(', ');
        const waMsg = `✅ *PEDIDO REGISTRADO*\n\nHola, soy *${userName}*.\nHe realizado un pedido por la web:\n📦 *Detalle:* ${orderSummary}\n💰 *Total:* S/${total.toFixed(2)}\n🆔 *Pedido:* ${result.pedidoId}\n\n👇 *ADJUNTO MI COMPROBANTE DE YAPE AQUÍ:*`;
        const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMsg)}`;
        
        // Pequeño delay para que el usuario vea el éxito antes de saltar a WA
        setTimeout(() => {
          window.location.href = waUrl;
          onSuccess();
        }, 500);
      } else {
        setErrorMsg(result.message || 'Error al procesar el pedido.');
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de conexión. Inténtalo de nuevo.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white pb-20">
      <div className="p-4 border-b flex items-center gap-4 bg-indigo-600 text-white sticky top-0 z-10">
        <button onClick={onBack} className="p-1"><ArrowLeft /></button>
        <h2 className="text-lg font-bold">Finalizar Pedido</h2>
      </div>

      <div className="p-6 max-w-md mx-auto">
        <div className="flex justify-center mb-8 relative px-10">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          {[1, 2].map((s) => (
            <div key={s} className={`mx-4 w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 border-4 ${step >= s ? 'bg-indigo-600 text-white border-white shadow-md' : 'bg-gray-100 text-gray-400 border-white'}`}>{s}</div>
          ))}
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-2 border-red-100 p-4 rounded-xl mb-6 flex gap-3 items-start animate-in fade-in duration-300">
            <AlertTriangle className="text-red-500 shrink-0" size={20} />
            <p className="text-sm text-red-700 font-bold">{errorMsg}</p>
          </div>
        )}

        {step === 1 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-800">Revisa tu pedido</h3>
            <div className="bg-gray-50 rounded-2xl p-5 mb-6 shadow-inner border border-gray-100">
              {cart.map(item => (
                <div key={item.id} className="flex justify-between py-3 border-b border-gray-200 last:border-0">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-gray-800">{item.nombre}</span>
                    <span className="text-xs text-gray-500">Cantidad: {item.quantity}</span>
                  </div>
                  <span className="text-sm font-bold text-indigo-600">S/ {(item.precio * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="flex justify-between mt-4 pt-4 border-t-2 border-indigo-200">
                <span className="font-bold text-lg text-gray-800">Total a Pagar</span>
                <span className="font-bold text-2xl text-indigo-600">S/ {total.toFixed(2)}</span>
              </div>
            </div>
            <button 
              onClick={() => { setErrorMsg(null); setStep(2); }} 
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform"
            >
              Continuar al Pago
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-indigo-50 p-6 rounded-full shadow-inner">
                <img src="https://upload.wikimedia.org/wikipedia/commons/d/d1/Yape_logo.png" alt="Yape" className="w-16 h-16 object-contain" />
              </div>
            </div>
            
            <h3 className="text-2xl font-bold mb-2">Paso Final: Pagar</h3>
            <p className="text-gray-500 mb-6">Yapea el monto total a este número:</p>
            
            <div onClick={copyYape} className="bg-gray-100 p-5 rounded-2xl flex items-center justify-between mb-4 cursor-pointer border-2 border-dashed border-indigo-200 active:bg-indigo-50 transition-colors">
              <span className="text-2xl font-mono font-bold tracking-widest text-gray-700">{YAPE_NUMBER}</span>
              <div className="bg-white p-2 rounded-xl shadow-sm">
                {isCopied ? <CheckCircle2 className="text-green-500" /> : <Copy className="text-indigo-600" />}
              </div>
            </div>
            {isCopied && <p className="text-green-600 text-xs font-bold mb-6 animate-bounce">¡Número copiado!</p>}

            <div className="bg-amber-50 border border-amber-100 p-4 rounded-xl mb-8 text-left">
              <p className="text-amber-800 text-sm font-medium leading-tight">
                ⚠️ <b>Importante:</b> Al presionar el botón, registraremos tu pedido y te abriremos WhatsApp para que <b>adjuntes la foto de tu voucher</b>.
              </p>
            </div>

            <button 
              disabled={isUploading} 
              onClick={submitOrder} 
              className="w-full bg-green-600 disabled:bg-gray-300 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-transform"
            >
              {isUploading ? (
                <><Loader2 className="animate-spin" /> REGISTRANDO...</>
              ) : (
                <><MessageCircle size={24} /> YA YAPEÉ, ENVIAR</>
              )}
            </button>
            
            <button 
              onClick={() => setStep(1)} 
              className="mt-6 text-gray-400 font-bold text-sm"
            >
              Volver a revisar pedido
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;
