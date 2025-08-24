type Props = {
  name: string;
  price: number;
  qty: number;
};

const CartItem = ({ name, price, qty }: Props) => {
  return (
    <div className="flex items-center gap-4">
      <div className="grid size-16 place-items-center rounded-lg bg-gray-100">{/* <Image/> */}</div>

      <div className="flex flex-grow">
        <div>
          <p className="text-15 font-bold text-black">{name}</p>
          <p className="text-14 font-bold tracking-normal text-black/50">{price}</p>
        </div>
        <p className="ml-auto text-15 font-bold text-black/50">x{qty}</p>
      </div>
    </div>
  );
};

export default CartItem;
