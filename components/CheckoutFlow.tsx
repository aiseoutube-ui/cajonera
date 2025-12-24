
import React, { useState, useRef } from 'react';
import { Camera, CheckCircle2, Copy, Send, Loader2, ArrowLeft, AlertTriangle } from 'lucide-react';
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
  const [voucherBase64, setVoucherBase64] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const copyYape = () => {
    navigator.clipboard.writeText(YAPE_NUMBER.replace(/\s/g, ''));
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;
        if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
        else { if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; } }
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx?.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
        setVoucherBase64(dataUrl);
        setStep(3);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const submitOrder = async () => {
    if (!voucherBase64) return;
    setIsUploading(true);
    setErrorMsg(null);

    try {
      // IMPORTANTE: Para GAS, no enviamos cabecera Content-Type: application/json
      // Esto evita el Preflight OPTIONS request que GAS no soporta.
      const response = await fetch(API_URL, {
        method: 'POST',
        mode: 'cors',
        redirect: 'follow',
        body: JSON.stringify({
          userName,
          cart,
          total,
          voucherBase64
        }),
      });

      const result = await response.json();
      if (result.status === 'success') {
        const orderSummary = cart.map(i => `${i.quantity}x ${i.nombre}`).join(', ');
        const waMsg = `Hola, soy ${userName}. Ya pedí: ${orderSummary} por la web y subí mi voucher. Total: S/${total.toFixed(2)}. Mi ID de pedido es: ${result.pedidoId}`;
        const waUrl = `https://wa.me/${ADMIN_PHONE}?text=${encodeURIComponent(waMsg)}`;
        window.location.href = waUrl;
        onSuccess();
      } else {
        setErrorMsg(result.message || 'Error al procesar el pedido.');
        if (result.message && result.message.includes('Stock')) setStep(1);
      }
    } catch (error) {
      console.error(error);
      setErrorMsg('Error de conexión con Google. Verifica si el script está publicado como "Anyone".');
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
        <div className="flex justify-between mb-8 relative px-4">
          <div className="absolute top-1/2 left-0 w-full h-0.5 bg-gray-100 -translate-y-1/2 z-0"></div>
          {[1, 2, 3].map((s) => (
            <div key={s} className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold z-10 border-4 ${step >= s ? 'bg-indigo-600 text-white border-white shadow-md' : 'bg-gray-100 text-gray-400 border-white'}`}>{s}</div>
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
            <button onClick={() => { setErrorMsg(null); setStep(2); }} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg">Continuar al Pago</button>
          </div>
        )}

        {step === 2 && (
          <div className="animate-in slide-in-from-right duration-300 text-center">
            <div className="mb-6 flex justify-center">
              <div className="bg-indigo-50 p-6 rounded-full shadow-inner">
                <img src="https://picsum.photos/seed/yape/100/100" alt="Yape" className="w-16 h-16 rounded-xl shadow-md" />
              </div>
            </div>
            <h3 className="text-2xl font-bold mb-2">Yapea aquí</h3>
            <p className="text-gray-500 mb-6">Monto: <span className="text-indigo-600 font-bold">S/ {total.toFixed(2)}</span></p>
            <div onClick={copyYape} className="bg-gray-100 p-5 rounded-2xl flex items-center justify-between mb-8 cursor-pointer border-2 border-dashed border-indigo-200">
              <span className="text-2xl font-mono font-bold tracking-widest text-gray-700">{YAPE_NUMBER}</span>
              <div className="bg-white p-2 rounded-xl shadow-sm">{isCopied ? <CheckCircle2 className="text-green-500" /> : <Copy className="text-indigo-600" />}</div>
            </div>
            <button onClick={() => fileInputRef.current?.click()} className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-3"><Camera size={24} /> Subir Foto de Voucher</button>
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" capture="environment" onChange={handleFileChange} />
          </div>
        )}

        {step === 3 && (
          <div className="animate-in slide-in-from-right duration-300">
            <h3 className="text-xl font-bold mb-4 text-gray-800">¿Todo listo?</h3>
            <div className="relative rounded-2xl overflow-hidden mb-8 border-4 border-indigo-100 shadow-lg bg-gray-100 aspect-[3/4]">
              {voucherBase64 ? <img src={voucherBase64} className="w-full h-full object-cover" alt="Voucher" /> : <div className="flex items-center justify-center h-full text-gray-300"><Camera size={48} /></div>}
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
              <button onClick={() => setStep(2)} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-indigo-600 text-sm font-bold px-6 py-2 rounded-full shadow-xl">Cambiar foto</button>
            </div>
            <button disabled={isUploading} onClick={submitOrder} className="w-full bg-indigo-600 disabled:bg-gray-300 text-white py-5 rounded-2xl font-black text-xl flex items-center justify-center gap-3 shadow-2xl">
              {isUploading ? <><Loader2 className="animate-spin" /> PROCESANDO...</> : <><Send size={24} /> ENVIAR PEDIDO</>}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CheckoutFlow;
