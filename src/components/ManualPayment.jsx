import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import './ManualPayment.css';

export default function ManualPaymentEntry() {
  const [formData, setFormData] = useState({
    referenceId: '',
    paymentMethod: 'Online Deposit',
    paymentAmount: '',
    remarks: '',
    proofFile: null,
    paymentDate: new Date().toISOString().split('T')[0]
  });

  const [dragActive, setDragActive] = useState(false);
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleFile = (file) => {
    const validTypes = ['application/pdf', 'image/jpeg', 'image/jpg', 'image/png'];
    const maxSize = 5 * 1024 * 1024; // 5MB
    
    if (!validTypes.includes(file.type)) {
      setErrors(prev => ({ ...prev, proofFile: 'Please upload a PDF, JPG, or PNG file' }));
      return;
    }
    
    if (file.size > maxSize) {
      setErrors(prev => ({ ...prev, proofFile: 'File size must be less than 5MB' }));
      return;
    }
    
    setFormData(prev => ({
      ...prev,
      proofFile: file
    }));
    setErrors(prev => ({ ...prev, proofFile: '' }));
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.referenceId.trim()) {
      newErrors.referenceId = 'Reference ID is required';
    }
    
    if (!formData.paymentAmount || parseFloat(formData.paymentAmount.replace('$', '').replace(',', '')) <= 0) {
      newErrors.paymentAmount = 'Valid payment amount is required';
    }
    
    if (!formData.proofFile) {
      newErrors.proofFile = 'Proof of payment is required';
    }
    
    if (!formData.paymentDate) {
      newErrors.paymentDate = 'Payment date is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    const paymentData = {
      ...formData,
      paymentAmount: parseFloat(formData.paymentAmount.replace('$', '').replace(',', '')),
      timestamp: new Date().toISOString(),
      status: 'pending_verification',
      officer: 'Admin User'
    };
    
    console.log('Payment data submitted:', paymentData);
    
    const existingPayments = JSON.parse(localStorage.getItem('manualPayments') || '[]');
    existingPayments.push({ ...paymentData, id: Date.now() });
    localStorage.setItem('manualPayments', JSON.stringify(existingPayments));
    
    alert('Payment recorded successfully!');
    navigate('/admin/finance');
  };

  const handleCancel = () => {
    if (window.confirm('Are you sure you want to cancel? All unsaved changes will be lost.')) {
      navigate('/admin/finance');
    }
  };

  const formatCurrency = (value) => {
    if (!value) return '';
    const number = value.replace(/[^0-9.]/g, '');
    if (!number) return '';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(parseFloat(number));
  };

  const handleAmountChange = (e) => {
    const formatted = formatCurrency(e.target.value);
    setFormData(prev => ({
      ...prev,
      paymentAmount: formatted
    }));
    if (errors.paymentAmount) {
      setErrors(prev => ({ ...prev, paymentAmount: '' }));
    }
  };

  const removeFile = () => {
    setFormData(prev => ({ ...prev, proofFile: null }));
    setErrors(prev => ({ ...prev, proofFile: '' }));
  };

  return (
    <div className="manual-dashboard-page">

      <main className="manual-dashboard-main">
        <div className="manual-dashboard-container">
          <div className="manual-payment-header">
            <div className="header-content">
              <h1 className="manual-page-title">Cash Deposit Entry</h1>
              <p className="manual-page-subtitle">Record offline payments for invoices and accounts</p>
            </div>
            <div className="header-actions">
              <button className="manual-secondary-btn" onClick={handleCancel}>
                Cancel
              </button>
            </div>
          </div>

          <div className="payment-form-section">
            <div className="form-card">
              <div className="form-header">
                <h3 className="form-title">Payment Details</h3>
              </div>

              <form onSubmit={handleSubmit} className="payment-form">
                <div className="form-grid">
                  <div className="form-group">
                    <label className="form-label required">Reference ID</label>
                    <input
                      type="text"
                      name="referenceId"
                      value={formData.referenceId}
                      onChange={handleInputChange}
                      placeholder="e.g., INV-2024-001, CUST-12345, or Transaction ID"
                      className={`form-input ${errors.referenceId ? 'error' : ''}`}
                    />
                    {errors.referenceId && (
                      <span className="error-message">{errors.referenceId}</span>
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label required">Payment Date</label>
                    <input
                      type="date"
                      name="paymentDate"
                      value={formData.paymentDate}
                      onChange={handleInputChange}
                      className={`form-input ${errors.paymentDate ? 'error' : ''}`}
                    />
                    {errors.paymentDate && (
                      <span className="error-message">{errors.paymentDate}</span>
                    )}
                  </div>

                  <div>
                    <label className="form-label required">Payment Method</label>
                    <select
                      name="paymentMethod"
                      value={formData.paymentMethod}
                      onChange={handleInputChange}
                      className="form-select"
                    >
                      <option value="Online Deposit">Online Deposit</option>
                      <option value="Credit Card">Credit Card</option>
                      <option value="Cash">Cash</option>
                      <option value="Check">Check</option>
                      <option value="PayPal">PayPal</option>
                      <option value="Wire Transfer">Wire Transfer</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label required">Payment Amount</label>
                    <div className="amount-input-wrapper">
                      <span className="currency-symbol">$</span>
                      <input
                        type="text"
                        name="paymentAmount"
                        value={formData.paymentAmount}
                        onChange={handleAmountChange}
                        placeholder="0.00"
                        className={`form-input amount-input ${errors.paymentAmount ? 'error' : ''}`}
                      />
                    </div>
                    {errors.paymentAmount && (
                      <span className="error-message">{errors.paymentAmount}</span>
                    )}
                  </div>
                </div>
                <div className="manual-form-section">
                  <div className="manual-section-header">
                    <h4 className="section-title">Proof of Payment</h4>
                    <span className="section-hint">Required • Max 5MB • PDF, JPG, PNG</span>
                  </div>
                  
                  <div 
                    className={`upload-area ${dragActive ? 'drag-active' : ''} ${errors.proofFile ? 'error' : ''}`}
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                  >
                    <div className="upload-content">
                      <div className="upload-icon">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                          <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                          <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                        </svg>
                      </div>
                      
                      {formData.proofFile ? (
                        <div className="file-preview">
                          <div className="file-info">
                            <div className="file-icon">
                              {formData.proofFile.type === 'application/pdf' ? (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <path d="M14 2H6C5.46957 2 4.96086 2.21071 4.58579 2.58579C4.21071 2.96086 4 3.46957 4 4V20C4 20.5304 4.21071 21.0391 4.58579 21.4142C4.96086 21.7893 5.46957 22 6 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V8L14 2Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M14 2V8H20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M16 13H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M16 17H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M10 9H9H8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              ) : (
                                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <circle cx="8.5" cy="8.5" r="1.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                  <path d="M21 15L16 10L5 21" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                </svg>
                              )}
                            </div>
                            <div className="file-details">
                              <span className="file-name">{formData.proofFile.name}</span>
                              <span className="file-size">
                                {(formData.proofFile.size / 1024 / 1024).toFixed(2)} MB
                              </span>
                            </div>
                          </div>
                          <button 
                            type="button"
                            className="remove-file-btn"
                            onClick={removeFile}
                            aria-label="Remove file"
                          >
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                              <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <>
                          <h4 className="upload-title">Drag & drop files here</h4>
                          <p className="upload-text">or click to browse files on your computer</p>
                          <input
                            type="file"
                            id="fileInput"
                            accept=".pdf,.jpg,.jpeg,.png"
                            onChange={handleFileChange}
                            className="file-input"
                          />
                          <button 
                            type="button"
                            onClick={() => document.getElementById('fileInput').click()}
                            className="browse-btn"
                          >
                            Browse Files
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                  
                  {errors.proofFile && (
                    <span className="error-message">{errors.proofFile}</span>
                  )}
                </div>
                <div className="manual-form-section">
                  <div className="manual-section-header">
                    <h4 className="section-title">Additional Information</h4>
                    <span className="section-hint">Optional</span>
                  </div>
                  
                  <div >
                    <label className="form-label">Remarks</label>
                    <textarea
                      name="remarks"
                      value={formData.remarks}
                      onChange={handleInputChange}
                      placeholder="Add any notes or details about this payment..."
                      className="manual-form-textarea"
                      rows="4"
                    />
                    <div className="textarea-info">
                      <span className="char-count">{formData.remarks.length}/500 characters</span>
                    </div>
                  </div>
                </div>
                <div className="form-actions">
                  <button 
                    type="button"
                    onClick={handleCancel}
                    className="manual-secondary-action-btn"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit"
                    className="primary-action-btn"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                    Record Payment
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}