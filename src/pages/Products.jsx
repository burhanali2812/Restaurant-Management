import React, { useEffect, useState } from "react";
import axios from "axios";
import TopBar from "../components/TopBar";

function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);

  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [isEdit, setIsEdit] = useState(false);

  const token = localStorage.getItem("token");
  const user = JSON.parse(localStorage.getItem("user"));
  const restaurantId = user?.restid || "";

  const api = axios.create({
    baseURL: "https://restaurant-manage-backend.vercel.app/api/products",
    headers: { Authorization: `Bearer ${token}` },
  });

  const categoryApi = axios.create({
    baseURL: "https://restaurant-manage-backend.vercel.app/api/category",
    headers: { Authorization: `Bearer ${token}` },
  });

  const [formData, setFormData] = useState({
    _id: "",
    name: "",
    description: "",
    categoryId: "",
    price: "",
    isAvailable: true,
    variants: [{ name: "", price: "" }],
  });

  useEffect(() => {
    getProducts();
    getCategories();
  }, []);

  useEffect(() => {
    let data = [...products];

    if (search) {
      data = data.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase()),
      );
    }

    if (selectedCategory) {
      data = data.filter((p) => p.categoryId?._id === selectedCategory);
    }

    setFilteredProducts(data);
  }, [search, selectedCategory, products]);

  const getProducts = async () => {
    try {
      const res = await api.get(`/getProducts/${restaurantId}`);
      setProducts(res.data);
      setFilteredProducts(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const getCategories = async () => {
    try {
      const res = await categoryApi.get(`/getCategories/${restaurantId}`);
      setCategories(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  const handleInput = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleVariantChange = (index, field, value) => {
    const updated = [...formData.variants];
    updated[index][field] = value;
    setFormData({ ...formData, variants: updated });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: "" }],
    });
  };

  const removeVariant = (index) => {
    const updated = formData.variants.filter((_, i) => i !== index);
    setFormData({ ...formData, variants: updated });
  };

  const openAdd = () => {
    setIsEdit(false);
    setFormData({
      _id: "",
      name: "",
      description: "",
      categoryId: "",
      price: "",
      isAvailable: true,
      variants: [{ name: "", price: "" }],
    });
    setShowModal(true);
  };

  const openEdit = (product) => {
    setIsEdit(true);
    setFormData({
      _id: product._id,
      name: product.name,
      description: product.description,
      categoryId: product.categoryId?._id || "",
      price: product.price || "",
      isAvailable: product.isAvailable,
      variants:
        product.variants?.length > 0
          ? product.variants
          : [{ name: "", price: "" }],
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    try {
      if (isEdit) {
        await api.put(`/updateProduct/${formData._id}`, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          isAvailable: formData.isAvailable,
          variants: formData.variants,
        });
      } else {
        await api.post("/addProduct", {
          name: formData.name,
          description: formData.description,
          categoryId: formData.categoryId,
          restaurantId,
          price: formData.price,
          variants: formData.variants,
        });
      }

      setShowModal(false);
      getProducts();
    } catch (err) {
      console.log(err);
      alert(err.response?.data?.message || "Error");
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Delete product?")) return;

    try {
      await api.delete(`/deleteProduct/${id}`);
      getProducts();
    } catch (err) {
      console.log(err);
    }
  };

  // STATS
  const totalProducts = filteredProducts.length;
  const availableCount = filteredProducts.filter((p) => p.isAvailable).length;
  const notAvailableCount = totalProducts - availableCount;

  return (
    <div>
      <TopBar />
      <div className="container mt-4">
        {/* HEADER */}
        <div className="d-flex justify-content-between mb-3">
          <h3>Products</h3>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Product
          </button>
        </div>

        {/* STATS */}
        <div className="row mb-3">
          <div className="col-md-4">
            <div className="card p-3 text-center">
              <h6>Total Products</h6>
              <h3>{totalProducts}</h3>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 text-center bg-success text-white">
              <h6>Available</h6>
              <h3>{availableCount}</h3>
            </div>
          </div>

          <div className="col-md-4">
            <div className="card p-3 text-center bg-danger text-white">
              <h6>Not Available</h6>
              <h3>{notAvailableCount}</h3>
            </div>
          </div>
        </div>

        {/* SEARCH + CATEGORY */}
        <div className="row mb-3">
          <div className="col-md-6">
            <input
              className="form-control"
              placeholder="Search product..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          <div className="col-md-6">
            <select
              className="form-control"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {filteredProducts.map((p, i) => (
                <tr key={p._id}>
                  <td>{i + 1}</td>
                  <td>{p.name}</td>
                  <td>{p.categoryId?.name || "N/A"}</td>
                  <td>{p.price}</td>

                  <td>
                    {p.variants?.map((v, idx) => (
                      <div key={idx}>
                        {v.name} - {v.price}
                      </div>
                    ))}
                  </td>

                  <td>{p.isAvailable ? "Available" : "Unavailable"}</td>

                  <td>
                    <button
                      className="btn btn-warning btn-sm me-2"
                      onClick={() => openEdit(p)}
                    >
                      Edit
                    </button>

                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => deleteProduct(p._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div
            className="modal show d-block"
            style={{ background: "rgba(0,0,0,0.5)" }}
          >
            <div className="modal-dialog modal-lg">
              <div className="modal-content">
                <div className="modal-header">
                  <h5>{isEdit ? "Edit Product" : "Add Product"}</h5>
                  <button
                    className="btn-close"
                    onClick={() => setShowModal(false)}
                  />
                </div>

                <div className="modal-body">
                  <input
                    className="form-control mb-2"
                    name="name"
                    placeholder="Product Name"
                    value={formData.name}
                    onChange={handleInput}
                  />

                  <textarea
                    className="form-control mb-2"
                    name="description"
                    placeholder="Description"
                    value={formData.description}
                    onChange={handleInput}
                  />

                  {!isEdit && (
                    <select
                      className="form-control mb-2"
                      name="categoryId"
                      value={formData.categoryId}
                      onChange={handleInput}
                    >
                      <option value="">Select Category</option>
                      {categories.map((c) => (
                        <option key={c._id} value={c._id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                  )}

                  <input
                    className="form-control mb-2"
                    type="number"
                    name="price"
                    placeholder="Price"
                    value={formData.price}
                    onChange={handleInput}
                  />

                  {/* VARIANTS */}
                  <div className="d-flex justify-content-between mb-2">
                    <h5>Variants</h5>
                    <button
                      className="btn btn-success btn-sm"
                      onClick={addVariant}
                    >
                      + Add
                    </button>
                  </div>

                  {formData.variants.map((v, i) => (
                    <div className="row mb-2" key={i}>
                      <div className="col-md-3 d-flex gap-2">
                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleVariantChange(i, "name", "Half")}
                        >
                          Half
                        </button>

                        <button
                          className="btn btn-sm btn-outline-primary"
                          onClick={() => handleVariantChange(i, "name", "Full")}
                        >
                          Full
                        </button>
                      </div>

                      <div className="col-md-5">
                        <input
                          className="form-control"
                          placeholder="Price"
                          value={v.price}
                          onChange={(e) =>
                            handleVariantChange(i, "price", e.target.value)
                          }
                        />
                      </div>

                      <div className="col-md-2">
                        <button
                          className="btn btn-danger w-100"
                          onClick={() => removeVariant(i)}
                        >
                          X
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Close
                  </button>

                  <button className="btn btn-primary" onClick={handleSubmit}>
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

export default Products;
