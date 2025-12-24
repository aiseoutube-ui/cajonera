
import React, { useState } from 'react';

interface WelcomeModalProps {
  onSave: (name: string) => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onSave }) => {
  const [name, setName] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onSave(name.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-70 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm bg-white rounded-2xl p-8 shadow-2xl animate-in fade-in zoom-in duration-300">
        <div className="text-center mb-6">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-4xl">👋</span>
          </div>
          <h2 className="text-2xl font-bold text-gray-800">¡Hola Casero!</h2>
          <p className="text-gray-500 mt-2">¿Cuál es tu nombre en el grupo de WhatsApp?</p>
        </div>
        
        <form onSubmit={handleSubmit}>
          <input
            autoFocus
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Escribe tu nombre aquí..."
            className="w-full px-4 py-4 border-2 border-indigo-100 rounded-xl focus:border-indigo-500 outline-none text-lg transition-colors"
            required
          />
          <button
            type="submit"
            className="w-full mt-6 bg-indigo-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-indigo-200 active:scale-95 transition-transform"
          >
            Empezar a comprar
          </button>
        </form>
      </div>
    </div>
  );
};

export default WelcomeModal;
