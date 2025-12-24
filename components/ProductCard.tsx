
import React from 'react';
import { ShoppingCart, AlertCircle, PackageX } from 'lucide-react';
import { Product } from '../types';

interface ProductCardProps {
  product: Product;
  onAddToCart: (p: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart }) => {
  const progress = Math.min((product.vendidos_actual / product.meta_stock) * 100, 100);
  const isUrgent = progress > 80 && progress < 100;
  const isOutOfStock = progress >= 100;

  return (
    <div className={`bg-white rounded-xl overflow-hidden shadow-sm border border-gray-100 flex flex-col transition-opacity ${isOutOfStock ? 'opacity-75' : 'opacity-100'}`}>
      <div className="relative aspect-square bg-gray-200">
        <img 
          src={product.imagen_url || 'https://picsum.photos/400/400'} 
          alt={product.nombre}
          className={`w-full h-full object-cover transition-filter duration-300 ${isOutOfStock ? 'grayscale' : ''}`}
        />
        {isUrgent && (
          <div className="absolute top-2 right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-1 rounded-full animate-pulse uppercase tracking-wider shadow-lg">
            ¡Quedan pocos!
          </div>
        )}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
            <div className="bg-white text-gray-900 text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1 shadow-xl">
              <PackageX size={14} /> LOTE CERRADO
            </div>
          </div>
        )}
      </div>

      <div className="p-3 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 min-h-[40px] leading-tight">
          {product.nombre}
        </h3>
        <p className="text-indigo-600 font-bold text-lg mt-1">S/ {Number(product.precio).toFixed(2)}</p>
        
        {/* Lote Progress */}
        <div className="mt-3">
          <div className="flex justify-between items-end mb-1">
            <span className="text-[10px] text-gray-500 font-medium">Lote Actual</span>
            <span className={`text-[10px] font-bold ${isOutOfStock ? 'text-gray-400' : isUrgent ? 'text-red-600' : 'text-indigo-500'}`}>
              {product.vendidos_actual}/{product.meta_stock}
            </span>
          </div>
          <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className={`h-full transition-all duration-500 ${
                isOutOfStock ? 'bg-gray-300' : isUrgent ? 'bg-red-500' : progress > 50 ? 'bg-indigo-500' : 'bg-green-500'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>
          {isUrgent && (
            <p className="text-[9px] text-red-500 font-bold mt-1 flex items-center gap-1">
              <AlertCircle size={10} /> ¡Casi cerramos el lote!
            </p>
          )}
        </div>

        <button 
          onClick={() => onAddToCart(product)}
          disabled={isOutOfStock}
          className={`mt-4 w-full font-bold py-2 rounded-lg transition-all flex items-center justify-center gap-2 text-sm ${
            isOutOfStock 
            ? 'bg-gray-100 text-gray-400 cursor-not-allowed' 
            : 'bg-indigo-50 hover:bg-indigo-600 hover:text-white text-indigo-700 active:scale-95'
          }`}
        >
          {isOutOfStock ? 'Sin stock' : <><ShoppingCart size={16} /> Agregar</>}
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
