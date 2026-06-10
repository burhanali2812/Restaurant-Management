import React, { useState } from "react";
import qz from "qz-tray";

export default function TestPrint() {
  const [printers, setPrinters] = useState([]);

  const getPrinters = async () => {
    try {
      if (!qz.websocket.isActive()) {
        await qz.websocket.connect();
      }

      const list = await qz.printers.find();
      setPrinters(list);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="container mt-3">
      <button className="btn btn-primary mb-3" onClick={getPrinters}>
        Load Printers
      </button>

      <table className="table table-bordered">
        <thead>
          <tr>
            <th>#</th>
            <th>Printer Name</th>
          </tr>
        </thead>
        <tbody>
          {printers.map((printer, index) => (
            <tr key={printer}>
              <td>{index + 1}</td>
              <td>{printer}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}