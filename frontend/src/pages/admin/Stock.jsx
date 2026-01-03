import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import stockService from '../../services/stockService';
import productService from '../../services/productService';
import supplierService from '../../services/supplierService';
import Toast from '../../components/Toast';

const Stock = () => {
  const [activeTab, setActiveTab] = useState('import');
  const [products, setProducts] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [lowStock, setLowStock] = useState([]);

  const [importItems, setImportItems] = useState([{ product_id: '', quantity: '', unit_price: '', supplier_id: '' }]);
  const [exportItems, setExportItems] = useState([{ product_id: '', quantity: '' }]);
  const [notes, setNotes] = useState('');
  const [toast, setToast] = useState(null);

  useEffect(() => {
    fetchProducts();
    fetchSuppliers();
    fetchTransactions();
    fetchLowStock();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await productService.getProducts({ per_page: 1000 });
      setProducts(response.data.data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchSuppliers = async () => {
    try {
      const response = await supplierService.getSuppliers();
      setSuppliers(response.data || []);
    } catch (error) {
      console.error('Error fetching suppliers:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      const response = await stockService.getTransactions({ per_page: 50 });
      setTransactions(response.data.data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchLowStock = async () => {
    try {
      const response = await stockService.getLowStock();
      setLowStock(response.data || []);
    } catch (error) {
      console.error('Error fetching low stock:', error);
    }
  };

  const handleImport = async () => {
    try {
      const validItems = importItems.filter(item => item.product_id && item.quantity && item.unit_price);
      if (validItems.length === 0) {
        setToast({ message: 'Vui lòng nhập thông tin sản phẩm', type: 'error' });
        return;
      }

      await stockService.importStock({ items: validItems, notes });
      setToast({ message: 'Nhập kho thành công!', type: 'success' });
      setImportItems([{ product_id: '', quantity: '', unit_price: '', supplier_id: '' }]);
      setNotes('');
      fetchProducts();
      fetchLowStock();
      fetchTransactions();
    } catch (error) {
      setToast({ message: 'Lỗi: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const handleExport = async () => {
    try {
      const validItems = exportItems.filter(item => item.product_id && item.quantity);
      if (validItems.length === 0) {
        setToast({ message: 'Vui lòng nhập thông tin sản phẩm', type: 'error' });
        return;
      }

      await stockService.exportStock({ items: validItems, notes });
      setToast({ message: 'Xuất kho thành công!', type: 'success' });
      setExportItems([{ product_id: '', quantity: '' }]);
      setNotes('');
      fetchProducts();
      fetchTransactions();
      fetchLowStock();
    } catch (error) {
      setToast({ message: 'Lỗi: ' + (error.response?.data?.message || error.message), type: 'error' });
    }
  };

  const addImportRow = () => {
    setImportItems([...importItems, { product_id: '', quantity: '', unit_price: '', supplier_id: '' }]);
  };

  const addExportRow = () => {
    setExportItems([...exportItems, { product_id: '', quantity: '' }]);
  };

  const updateImportItem = (index, field, value) => {
    const newItems = [...importItems];
    newItems[index][field] = value;
    setImportItems(newItems);
  };

  const updateExportItem = (index, field, value) => {
    const newItems = [...exportItems];
    newItems[index][field] = value;
    setExportItems(newItems);
  };

  const removeImportRow = (index) => {
    setImportItems(importItems.filter((_, i) => i !== index));
  };

  const removeExportRow = (index) => {
    setExportItems(exportItems.filter((_, i) => i !== index));
  };

  return (
    <div className="admin-stock">
      <div className="admin-page-header">
        <div>
          <h1>Quản Lý Kho</h1>
          <div className="admin-breadcrumb">
            <Link to="/admin">Dashboard</Link>
            <span>/</span>
            <span>Kho</span>
          </div>
        </div>
      </div>

      {lowStock.length > 0 && (
        <div style={{ background: '#fef3c7', border: '2px solid #f59e0b', borderRadius: '0.5rem', padding: '1rem', marginBottom: '1.5rem' }}>
          <strong style={{ color: '#92400e' }}>⚠️ Cảnh báo: {lowStock.length} sản phẩm sắp hết hàng!</strong>
        </div>
      )}

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '2px solid #e2e8f0' }}>
        <button onClick={() => setActiveTab('import')} className={`btn ${activeTab === 'import' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          Nhập Kho
        </button>
        <button onClick={() => setActiveTab('export')} className={`btn ${activeTab === 'export' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          Xuất Kho
        </button>
        <button onClick={() => setActiveTab('history')} className={`btn ${activeTab === 'history' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          Lịch Sử
        </button>
        <button onClick={() => setActiveTab('lowstock')} className={`btn ${activeTab === 'lowstock' ? 'btn-primary' : 'btn-secondary'}`} style={{ borderRadius: '0.5rem 0.5rem 0 0' }}>
          Sắp Hết ({lowStock.length})
        </button>
      </div>

      {/* Import Tab */}
      {activeTab === 'import' && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '1rem' }}>Phiếu Nhập Kho</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Giá nhập (đ)</th>
                <th>Nhà cung cấp</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {importItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select value={item.product_id} onChange={(e) => updateImportItem(index, 'product_id', e.target.value)} className="form-control">
                      <option value="">Chọn sản phẩm</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock_quantity})</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="number" value={item.quantity} onChange={(e) => updateImportItem(index, 'quantity', e.target.value)} min="1" className="form-control" /></td>
                  <td><input type="number" value={item.unit_price} onChange={(e) => updateImportItem(index, 'unit_price', e.target.value)} min="0" className="form-control" /></td>
                  <td>
                    <select
                      value={item.supplier_id}
                      onChange={(e) => updateImportItem(index, 'supplier_id', e.target.value)}
                      className="form-control"
                    >
                      <option value="">Chọn NCC</option>
                      {suppliers
                        .filter(s => s.is_active)  // chỉ lấy supplier active
                        .map(s => (
                          <option key={s.id} value={s.id}>{s.name}</option>
                        ))
                      }
                    </select>
                  </td>
                  <td><button onClick={() => removeImportRow(index)} className="btn btn-danger btn-sm">Xóa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={addImportRow} className="btn btn-secondary">+ Thêm dòng</button>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Ghi chú</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-control" rows="3" />
          </div>
          <button onClick={handleImport} className="btn btn-primary" style={{ marginTop: '1rem' }}>✓ Xác Nhận Nhập Kho</button>
        </div>
      )}

      {/* Export Tab */}
      {activeTab === 'export' && (
        <div style={{ background: 'white', padding: '1.5rem', borderRadius: '0.5rem', border: '1px solid #e2e8f0' }}>
          <h2 style={{ marginBottom: '1rem' }}>Phiếu Xuất Kho</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Số lượng xuất</th>
                <th>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {exportItems.map((item, index) => (
                <tr key={index}>
                  <td>
                    <select value={item.product_id} onChange={(e) => updateExportItem(index, 'product_id', e.target.value)} className="form-control">
                      <option value="">Chọn sản phẩm</option>
                      {products.map(p => (
                        <option key={p.id} value={p.id}>{p.name} (Tồn: {p.stock_quantity})</option>
                      ))}
                    </select>
                  </td>
                  <td><input type="number" value={item.quantity} onChange={(e) => updateExportItem(index, 'quantity', e.target.value)} min="1" className="form-control" /></td>
                  <td><button onClick={() => removeExportRow(index)} className="btn btn-danger btn-sm">Xóa</button></td>
                </tr>
              ))}
            </tbody>
          </table>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem' }}>
            <button onClick={addExportRow} className="btn btn-secondary">+ Thêm dòng</button>
          </div>
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label>Ghi chú</label>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="form-control" rows="3" />
          </div>
          <button onClick={handleExport} className="btn btn-primary" style={{ marginTop: '1rem' }}>✓ Xác Nhận Xuất Kho</button>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="admin-table-container">
          <h2>Lịch Sử Nhập Xuất</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Ngày</th>
                <th>Loại</th>
                <th>Sản phẩm</th>
                <th>Số lượng</th>
                <th>Nhà cung cấp</th>
                <th>Ghi chú</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.id}>
                  <td>{new Date(tx.transaction_date).toLocaleString('vi-VN')}</td>
                  <td><span className={`badge ${tx.type === 'IMPORT' ? 'badge-success' : 'badge-warning'}`}>{tx.type === 'IMPORT' ? 'Nhập' : 'Xuất'}</span></td>
                  <td>{tx.product?.name}</td>
                  <td>{tx.quantity}</td>
                  <td>{tx.supplier?.name || 'N/A'}</td>
                  <td>{tx.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Low Stock Tab */}
      {activeTab === 'lowstock' && (
        <div className="admin-table-container">
          <h2>Sản Phẩm Sắp Hết Hàng</h2>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sản phẩm</th>
                <th>Tồn kho</th>
                <th>Mức tối thiểu</th>
                <th>Nhà cung cấp</th>
              </tr>
            </thead>
            <tbody>
              {lowStock.map(product => (
                <tr key={product.id}>
                  <td><strong>{product.name}</strong></td>
                  <td style={{ color: '#dc2626', fontWeight: '700' }}>{product.stock_quantity}</td>
                  <td>{product.min_stock_level}</td>
                  <td>{product.supplier?.name || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
};

export default Stock;
