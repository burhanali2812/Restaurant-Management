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

  const emptyForm = {
    _id: "",
    name: "",
    description: "",
    categoryId: "",
    price: "",
    isAvailable: true,
    variants: [],
  };

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    getProducts();
    getCategories();
  }, []);

  useEffect(() => {
    let data = [...products];
    if (search)
      data = data.filter((p) =>
        p.name.toLowerCase().includes(search.toLowerCase())
      );
    if (selectedCategory)
      data = data.filter((p) => p.categoryId?._id === selectedCategory);
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
    updated[index] = { ...updated[index], [field]: value };
    setFormData({ ...formData, variants: updated });
  };

  const addVariant = () => {
    setFormData({
      ...formData,
      variants: [...formData.variants, { name: "", price: "" }],
    });
  };

  const removeVariant = (index) => {
    setFormData({
      ...formData,
      variants: formData.variants.filter((_, i) => i !== index),
    });
  };

  const openAdd = () => {
    setIsEdit(false);
    setFormData(emptyForm);
    setShowModal(true);
  };

  const openEdit = (product) => {
    setIsEdit(true);
    setFormData({
      _id: product._id,
      name: product.name,
      description: product.description || "",
      categoryId: product.categoryId?._id || "",
      price: product.price || "",
      isAvailable: product.isAvailable,
      variants: product.variants?.length > 0 ? product.variants : [],
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    // Strip variants with no name
    const cleanVariants = formData.variants.filter((v) => v.name.trim());

    try {
      if (isEdit) {
        await api.put(`/updateProduct/${formData._id}`, {
          name: formData.name,
          description: formData.description,
          price: formData.price,
          isAvailable: formData.isAvailable,
          variants: cleanVariants,
        });
      } else {
        await api.post("/addProduct", {
          name: formData.name,
          description: formData.description,
          categoryId: formData.categoryId,
          restaurantId,
          price: formData.price,
          variants: cleanVariants,
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

  const totalProducts    = filteredProducts.length;
  const availableCount   = filteredProducts.filter((p) => p.isAvailable).length;
  const notAvailableCount = totalProducts - availableCount;

  // Quick-select preset names for variants
  const PRESET_NAMES = ["Half", "Full", "Small", "Medium", "Large"];

  return (
    <div>
      <TopBar />
      <div className="container mt-4">

        {/* HEADER */}
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Products</h3>
          <button className="btn btn-primary" onClick={openAdd}>
            + Add Product
          </button>
        </div>

        {/* STATS */}
        <div className="row mb-3">
          <div className="col-md-4">
            <div className="card p-3 text-center">
              <h6 className="text-muted">Total Products</h6>
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

        {/* SEARCH + FILTER */}
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
                <option key={c._id} value={c._id}>{c.name}</option>
              ))}
            </select>
          </div>
        </div>

        {/* TABLE */}
        <div className="table-responsive">
          <table className="table table-bordered align-middle">
            <thead className="table-dark">
              <tr>
                <th>#</th>
                <th>Name</th>
                <th>Category</th>
                <th>Base Price</th>
                <th>Variants</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center text-muted py-4">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p, i) => (
                  <tr key={p._id}>
                    <td>{i + 1}</td>
                    <td><strong>{p.name}</strong></td>
                    <td>{p.categoryId?.name || "N/A"}</td>
                    <td>{p.price ? `Rs.${p.price}` : <span className="text-muted">—</span>}</td>
                    <td>
                      {p.variants?.length > 0 ? (
                        <div className="d-flex flex-wrap gap-1">
                          {p.variants.map((v, idx) => (
                            <span key={idx} className="badge bg-secondary">
                              {v.name} — Rs.{v.price}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-muted">No variants</span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${p.isAvailable ? "bg-success" : "bg-danger"}`}>
                        {p.isAvailable ? "Available" : "Unavailable"}
                      </span>
                    </td>
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
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* MODAL */}
        {showModal && (
          <div className="modal show d-block" style={{ background: "rgba(0,0,0,0.5)" }}>
            <div className="modal-dialog modal-lg">
              <div className="modal-content">

                <div className="modal-header">
                  <h5 className="modal-title">
                    {isEdit ? "Edit Product" : "Add Product"}
                  </h5>
                  <button className="btn-close" onClick={() => setShowModal(false)} />
                </div>

                <div className="modal-body">

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Product Name</label>
                    <input
                      className="form-control"
                      name="name"
                      placeholder="e.g. Daal Mash"
                      value={formData.name}
                      onChange={handleInput}
                    />
                  </div>

                  <div className="mb-2">
                    <label className="form-label fw-semibold">Description</label>
                    <textarea
                      className="form-control"
                      name="description"
                      placeholder="Optional description"
                      rows={2}
                      value={formData.description}
                      onChange={handleInput}
                    />
                  </div>

                  {!isEdit && (
                    <div className="mb-2">
                      <label className="form-label fw-semibold">Category</label>
                      <select
                        className="form-control"
                        name="categoryId"
                        value={formData.categoryId}
                        onChange={handleInput}
                      >
                        <option value="">Select Category</option>
                        {categories.map((c) => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-semibold">
                      Base Price{" "}
                      <small className="text-muted fw-normal">(optional if using variants)</small>
                    </label>
                    <input
                      className="form-control"
                      type="number"
                      name="price"
                      placeholder="e.g. 350"
                      value={formData.price}
                      onChange={handleInput}
                    />
                  </div>

                  {/* AVAILABILITY */}
                  {isEdit && (
                    <div className="mb-3 d-flex align-items-center gap-3">
                      <label className="form-label fw-semibold mb-0">Availability</label>
                      <div className="form-check form-switch mb-0">
                        <input
                          className="form-check-input"
                          type="checkbox"
                          id="availSwitch"
                          checked={formData.isAvailable}
                          onChange={(e) =>
                            setFormData({ ...formData, isAvailable: e.target.checked })
                          }
                        />
                        <label
                          className={`form-check-label fw-semibold ${
                            formData.isAvailable ? "text-success" : "text-danger"
                          }`}
                          htmlFor="availSwitch"
                        >
                          {formData.isAvailable ? "Available" : "Unavailable"}
                        </label>
                      </div>
                    </div>
                  )}

                  {/* VARIANTS */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <h6 className="mb-0 fw-semibold">Variants</h6>
                    <button className="btn btn-success btn-sm" onClick={addVariant}>
                      + Add Variant
                    </button>
                  </div>

                  {formData.variants.length === 0 && (
                    <p className="text-muted small mb-2">
                      No variants added. Click "+ Add Variant" to add sizes like Half / Full.
                    </p>
                  )}

                  {formData.variants.map((v, i) => (
                    <div key={i} className="border rounded p-2 mb-2 bg-light">

                      {/* Preset quick-select buttons */}
                      <div className="mb-2">
                        <label className="form-label small mb-1 text-muted">
                          Quick select name:
                        </label>
                        <div className="d-flex flex-wrap gap-1">
                          {PRESET_NAMES.map((preset) => (
                            <button
                              key={preset}
                              type="button"
                              className={`btn btn-sm ${
                                v.name === preset
                                  ? "btn-primary"
                                  : "btn-outline-primary"
                              }`}
                              onClick={() => handleVariantChange(i, "name", preset)}
                            >
                              {preset}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="row g-2 align-items-center">
                        {/* Name input — editable, presets just fill it */}
                        <div className="col-md-5">
                          <input
                            className="form-control"
                            placeholder="Variant name (e.g. Half)"
                            value={v.name}
                            onChange={(e) =>
                              handleVariantChange(i, "name", e.target.value)
                            }
                          />
                        </div>

                        {/* Price input */}
                        <div className="col-md-5">
                          <div className="input-group">
                            <span className="input-group-text">Rs.</span>
                            <input
                              className="form-control"
                              type="number"
                              placeholder="Price"
                              value={v.price}
                              onChange={(e) =>
                                handleVariantChange(i, "price", e.target.value)
                              }
                            />
                          </div>
                        </div>

                        {/* Remove */}
                        <div className="col-md-2">
                          <button
                            className="btn btn-danger w-100"
                            onClick={() => removeVariant(i)}
                          >
                            ✕
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}

                </div>

                <div className="modal-footer">
                  <button
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button className="btn btn-primary" onClick={handleSubmit}>
                    {isEdit ? "Update Product" : "Save Product"}
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