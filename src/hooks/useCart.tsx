import { createContext, ReactNode, useContext, useState } from "react";
import { toast } from "react-toastify";
import { api } from "../services/api";
import { Product, Stock } from "../types";

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem("@RocketShoes:cart");

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }
    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const checkProductExistInCart = cart.find(
        (item) => item.id === productId
      );
      if (!checkProductExistInCart) {
        const response = await api.get<Product>(`products/${productId}`);
        const { id, title, image, price } = response.data;
        const newProduct = [
          ...cart,
          {
            id,
            title,
            image,
            price,
            amount: 1,
          },
        ];
        setCart(newProduct);
        localStorage.setItem("@RocketShoes:cart", JSON.stringify(newProduct));
        return;
      }
      const { amount: Products } = checkProductExistInCart;
      const { data: Stock } = await api.get<Stock>(`stock/${productId}`);
      const compare = Stock.amount > Products;

      if (compare) {
        const updateCarAmount = cart.map((product) => {
          return product.id === productId
            ? {
                ...product,
                amount: product.amount + 1,
              }
            : product;
        });
        setCart(updateCarAmount);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(updateCarAmount)
        );
        return;
      }
      toast.error("Quantidade solicitada fora de estoque");
    } catch {
      toast.error("Erro na adição do produto");
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const checkProductExistInCart = cart.find(
        (item) => item.id === productId
      );

      if (!checkProductExistInCart) throw Error();

      if (checkProductExistInCart) {
        const removeProductInCart = cart.filter(
          (product) => product.id !== checkProductExistInCart.id
        );
        setCart(removeProductInCart);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(removeProductInCart)
        );
      }
    } catch {
      toast.error("Erro na remoção do produto");
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    try {
      if (amount <= 0) {
        return;
      }
      const { data } = await api.get<Product>(`stock/${productId}`);
      const compare = data.amount > amount;
      if (compare) {
        const updateCarAmount = cart.map((product) => {
          return product.id === productId
            ? {
                ...product,
                amount,
              }
            : product;
        });
        setCart(updateCarAmount);
        localStorage.setItem(
          "@RocketShoes:cart",
          JSON.stringify(updateCarAmount)
        );
        return;
      }
      toast.error("Quantidade solicitada fora de estoque");
    } catch {
      toast.error("Erro na alteração de quantidade do produto");
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
