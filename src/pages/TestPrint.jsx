import {
  connectQZ,
  printCustomerBill
} from "../services/qzPrintService";

export default function TestPrint() {

  const handlePrint = async () => {

    await connectQZ();

    const order = {
      OrderNo: "1001",
      tableNo: "5",
      total: 2500,
      discount: 0,
      items: [
        {
          name: "Chicken Karahi",
          variantName: "Half",
          quantity: 1,
          price: 1200,
        },
        {
          name: "BBQ Platter",
          variantName: "Full",
          quantity: 1,
          price: 1300,
        },
      ],
    };

    const restaurant = {
      name: "Karhai & BBQ",
      address: "Abbottabad",
      phone: "03123456789"
    };

    await printCustomerBill(
      order,
      restaurant,
    );
  };

  return (
    <button onClick={handlePrint}>
      Test Print
    </button>
  );
}