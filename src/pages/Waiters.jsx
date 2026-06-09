import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function Waiters() {
  const [waiters, setWaiters] = useState([]);
  const [filteredWaiters, setFilteredWaiters] = useState([]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));

  const restaurantId = user?.restid || "";

  const api = axios.create({
    baseURL: "http://localhost:5000/api/waiters",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
  });

  useEffect(() => {
    getWaiters();
  }, []);

  useEffect(() => {
    const filtered = waiters.filter((waiter) =>
      waiter.name.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredWaiters(filtered);
  }, [search, waiters]);

  const getWaiters = async () => {
    try {
      const res = await api.get(`/getWaiters/${restaurantId}`);

      setWaiters(res.data);
      setFilteredWaiters(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const openAdd = () => {
    setIsEdit(false);

    setFormData({
      _id: "",
      name: "",
    });

    setShowModal(true);
  };

  const openEdit = (waiter) => {
    setIsEdit(true);

    setFormData({
      _id: waiter._id,
      name: waiter.name,
    });

    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!formData.name.trim()) {
      return alert("Please enter waiter name");
    }

    try {
      if (isEdit) {
        await api.put(`/updateWaiter/${formData._id}`, {
          name: formData.name,
        });

        alert("Waiter Updated Successfully");
      } else {
        await api.post("/addWaiter", {
          name: formData.name,
          restaurantId,
        });

        alert("Waiter Added Successfully");
      }

      setShowModal(false);
      getWaiters();
    } catch (error) {
      console.log(error);
      alert(error.response?.data?.message || "Error");
    }
  };

  const deleteWaiter = async (id) => {
    if (!window.confirm("Delete waiter?")) return;

    try {
      await api.delete(`/deleteWaiter/${id}`);

      getWaiters();
    } catch (error) {
      console.log(error);
    }
  };

  return (
   <div>
    <TopBar />
     <div className="container mt-4">

      {/* HEADER */}
      <div className="d-flex justify-content-between mb-3">
        <h3>Waiters</h3>

        <button
          className="btn btn-primary"
          onClick={openAdd}
        >
          + Add Waiter
        </button>
      </div>

      {/* STATS */}
      <div className="row mb-3">
        <div className="col-md-4">
          <div className="card text-center p-3">
            <h6>Total Waiters</h6>
            <h3>{filteredWaiters.length}</h3>
          </div>
        </div>
      </div>

      {/* SEARCH */}
      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search waiter..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {/* TABLE */}
      <div className="table-responsive">
        <table className="table table-bordered">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Waiter Name</th>
              <th>Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredWaiters.length > 0 ? (
              filteredWaiters.map((waiter, index) => (
                <tr key={waiter._id}>
                  <td>{index + 1}</td>

                  <td>{waiter.name}</td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => openEdit(waiter)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        deleteWaiter(waiter._id)
                      }
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td
                  colSpan="3"
                  className="text-center"
                >
                  No Waiters Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* MODAL */}
      {showModal && (
        <div
          className="modal show d-block"
          style={{
            background: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5>
                  {isEdit
                    ? "Edit Waiter"
                    : "Add Waiter"}
                </h5>

                <button
                  className="btn-close"
                  onClick={() =>
                    setShowModal(false)
                  }
                />
              </div>

              <div className="modal-body">

                <input
                  className="form-control"
                  placeholder="Waiter Name"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                    })
                  }
                />

              </div>

              <div className="modal-footer">

                <button
                  className="btn btn-secondary"
                  onClick={() =>
                    setShowModal(false)
                  }
                >
                  Close
                </button>

                <button
                  className="btn btn-primary"
                  onClick={handleSubmit}
                >
                  {isEdit ? "Update" : "Save"}
                </button>

              </div>

            </div>
          </div>
        </div>
      )}

    </div>
   </div>
  );
}

export default Waiters;