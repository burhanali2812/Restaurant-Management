import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";
function Category() {
  const [categories, setCategories] = useState([]);
  const [filteredCategories, setFilteredCategories] = useState([]);

  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    description: "",
  });

  const token = localStorage.getItem("token");

  const api = axios.create({
    baseURL: "http://localhost:5000/api/category",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  const user = JSON.parse(localStorage.getItem("user"));

  useEffect(() => {
    getCategories();
  }, []);

  useEffect(() => {
    const filtered = categories.filter((category) =>
      category.name.toLowerCase().includes(search.toLowerCase())
    );

    setFilteredCategories(filtered);
  }, [search, categories]);

  const getCategories = async () => {
    try {
      const res = await api.get(`/getCategories/${user?.restid}`);

      setCategories(res.data);
      setFilteredCategories(res.data);
    } catch (error) {
      console.log(error);
    }
  };

  const resetForm = () => {
    setFormData({
      _id: "",
      name: "",
      description: "",
    });
  };

  const openAddModal = () => {
    resetForm();
    setIsEdit(false);
    setShowModal(true);
  };

  const openEditModal = (category) => {
    setFormData(category);
    setIsEdit(true);
    setShowModal(true);
  };

  const handleInput = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await api.put(`/updateCategory/${formData._id}`, {
          name: formData.name,
          description: formData.description,
        });

        alert("Category Updated Successfully");
      } else {
        await api.post(`/addCategory/${user.restId}`, {
          name: formData.name,
          description: formData.description,
        });

        alert("Category Added Successfully");
      }

      getCategories();
      setShowModal(false);
      resetForm();
    } catch (error) {
      alert(error.response?.data?.message || "Something went wrong");
    }
  };

  const deleteCategory = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this category?"
    );

    if (!confirmDelete) return;

    try {
      await api.delete(`/deleteCategory/${id}`);

      alert("Category Deleted Successfully");

      getCategories();
    } catch (error) {
      console.log(error);
    }
  };

  return (
   <div>
        <TopBar />
         <div className="container mt-4">
      <div className="d-flex justify-content-between align-items-center mb-3">
        <h3>Categories</h3>

        <button
          className="btn btn-primary"
          onClick={openAddModal}
        >
          Add Category
        </button>
      </div>

      <input
        type="text"
        className="form-control mb-3"
        placeholder="Search Category..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>
              <th>#</th>
              <th>Name</th>
              <th>Description</th>
              <th>Created At</th>
              <th width="180">Action</th>
            </tr>
          </thead>

          <tbody>
            {filteredCategories.length > 0 ? (
              filteredCategories.map((category, index) => (
                <tr key={category._id}>
                  <td>{index + 1}</td>

                  <td>{category.name}</td>

                  <td>{category.description}</td>

                  <td>
                    {new Date(
                      category.timestamp
                    ).toLocaleDateString()}
                  </td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => openEditModal(category)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() =>
                        deleteCategory(category._id)
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
                  colSpan="5"
                  className="text-center"
                >
                  No Categories Found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div
          className="modal fade show d-block"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
          }}
        >
          <div className="modal-dialog">
            <div className="modal-content">

              <div className="modal-header">
                <h5 className="modal-title">
                  {isEdit
                    ? "Edit Category"
                    : "Add Category"}
                </h5>

                <button
                  className="btn-close"
                  onClick={() =>
                    setShowModal(false)
                  }
                />
              </div>

              <div className="modal-body">

                <div className="mb-3">
                  <label>Name</label>

                  <input
                    type="text"
                    className="form-control"
                    name="name"
                    value={formData.name}
                    onChange={handleInput}
                  />
                </div>

                <div className="mb-3">
                  <label>Description</label>

                  <textarea
                    rows="4"
                    className="form-control"
                    name="description"
                    value={formData.description}
                    onChange={handleInput}
                  />
                </div>

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

export default Category;