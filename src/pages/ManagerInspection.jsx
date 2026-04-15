import React, { useState, useEffect, useMemo } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { toast } from 'react-toastify';
import { managerService } from '../services/interceptors/manager.service';
import { API_CONFIG, getMediaUrl } from '../config/api.config';
import "./ManagerInspection.css";

const ManagerInspection = () => {
  const location = useLocation();
  const isStart = location?.state?.startInspection;
  const auctionData = location?.state?.auctionData;

  const [open, setOpen] = useState(null);
  const [mainImage, setMainImage] = useState(0);
  const [imagePreview, setImagePreview] = useState(null);
  const navigate = useNavigate();

  // Checklist state
  const [checklistCategories, setChecklistCategories] = useState([]);
  const [checkedItems, setCheckedItems] = useState({}); // { "categoryName-itemIndex": true/false }
  const [loadingChecklist, setLoadingChecklist] = useState(false);

  const [generalRating, setGeneralRating] = useState(7);
  const [conditionSummary, setConditionSummary] = useState("Good");
  const [exteriorNotes, setExteriorNotes] = useState("");
  const [interiorNotes, setInteriorNotes] = useState("");
  const [finalNotes, setFinalNotes] = useState("");
  const [files, setFiles] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // New fields for approval section
  const [overallRatingRejection, setOverallRatingRejection] = useState("");
  const [overallRating, setOverallRating] = useState("");
  const [initialPrice, setInitialPrice] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");


  // Get images from auctionData media - only use real images from API, no static fallbacks
  const images = useMemo(() => {
    if (auctionData?.media?.length > 0) {
      const imageMedia = auctionData.media
        .filter(m => m.file && m.media_type !== 'file') // Filter out non-image files
        .map(m => {
          const filePath = m.file || m.image || m;
          return getMediaUrl(filePath);
        })
        .filter(url => url !== null); // Remove null values

      return imageMedia;
    }
    return []; // Return empty array if no images
  }, [auctionData?.media]);

  console.log("image: ", images);

  useEffect(() => {
    setMainImage(0);
  }, [images]);

  // Get seller name
  const sellerName = auctionData?.seller_details?.name || 'Unknown Seller';

  // Get manager name
  const managerName = auctionData?.manager_details
    ? `${auctionData.manager_details.first_name || ''} ${auctionData.manager_details.last_name || ''}`.trim() || auctionData.manager_details.email || 'Unknown Manager'
    : 'Unknown Manager';

  // Get category name
  const categoryName = auctionData?.category_name || 'Unknown';

  // Get item title
  const itemTitle = auctionData?.title || 'Unknown Item';

  // Get item description
  const itemDescription = auctionData?.description || '';

  // Get item ID
  const itemId = auctionData?.id ? `INSP-${auctionData.id}` : 'N/A';

  // Fetch checklist on component mount
  useEffect(() => {
    const fetchChecklist = async () => {
      if (!isStart || !categoryName) return;

      try {
        setLoadingChecklist(true);
        const checklists = await managerService.getChecklists();

        if (Array.isArray(checklists) && checklists.length > 0) {
          // Match category name with checklist title
          // e.g., "Vehicles" -> "Vehicles Inspection"
          const normalizedCategoryName = categoryName.toLowerCase().trim();

          const matchingChecklist = checklists.find(cl => {
            if (!cl.title) return false;
            const checklistTitle = cl.title.trim().toLowerCase();
            return checklistTitle === `${normalizedCategoryName} inspection` ||
              checklistTitle === normalizedCategoryName ||
              checklistTitle.startsWith(normalizedCategoryName);
          });

          if (matchingChecklist && matchingChecklist.template_data && typeof matchingChecklist.template_data === 'object') {
            // Convert template_data to checklist categories format
            const categories = Object.entries(matchingChecklist.template_data).map(([name, items], index) => ({
              id: `category-${index}`,
              name,
              items: Array.isArray(items) ? items.map((item, itemIndex) => ({
                id: `item-${index}-${itemIndex}`,
                name: typeof item === 'string' ? item : item.name || String(item)
              })) : []
            }));
            setChecklistCategories(categories);
          } else {
            setChecklistCategories([]);
          }
        } else {
          setChecklistCategories([]);
        }
      } catch (error) {
        console.error('Failed to load checklist:', error);
        setChecklistCategories([]);
      } finally {
        setLoadingChecklist(false);
      }
    };

    fetchChecklist();
  }, [isStart, categoryName]);

  const toggle = (index) => setOpen(open === index ? null : index);

  const handleFileUpload = (e) => {
    const selectedFiles = Array.from(e.target.files);
    const newImages = selectedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      url: URL.createObjectURL(file),
      name: file.name
    }));

    setUploadedImages(prev => [...prev, ...newImages]);
    setFiles(prev => [...prev, ...selectedFiles]);
  };

  const removeUploadedImage = (id) => {
    setUploadedImages(prev => prev.filter(img => img.id !== id));
  };

  const handleCheckboxChange = (categoryName, itemName, itemId) => {
    const key = `${categoryName}-${itemId}`;
    setCheckedItems(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleApprove = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    if (!auctionData?.id) {
      toast.error("Auction ID is missing. Cannot submit inspection.");
      return;
    }

    // Validate required fields
    if (!overallRating || !initialPrice || !startDate || !endDate) {
      toast.error("Please fill in all required fields: Overall Rating, Initial Price, Start Date, and End Date.");
      return;
    }

    setIsSubmitting(true);
    try {
      // Prepare checklist data in the format expected by API
      const checklistData = {};
      checklistCategories.forEach((category) => {
        const categoryData = {};
        category.items.forEach((item) => {
          const key = `${category.name}-${item.id}`;
          categoryData[item.name] = checkedItems[key] || false;
        });
        if (Object.keys(categoryData).length > 0) {
          checklistData[category.name] = categoryData;
        }
      });

      // Prepare inspection data
      const inspectionData = {
        decision: "APPROVED",
        overall_rating: parseFloat(overallRating),
        admin_feedback: finalNotes || "",
        checklist_data: checklistData,
        initial_price: parseFloat(initialPrice),
        start_date: new Date(startDate).toISOString(),
        end_date: new Date(endDate).toISOString(),
        buy_now_price: null,
        is_buy_now_enabled: "False",
        inspection_images: files
      };

      // Submit inspection
      const response = await managerService.performInspection(auctionData.id, inspectionData);
      toast.success("Inspection approved successfully!");

      // Navigate after a short delay to allow toast to be visible
      setTimeout(() => {
        navigate("/manager/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error submitting inspection:", error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to submit inspection. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (isSubmitting) return; // Prevent multiple submissions

    if (!auctionData?.id || !overallRatingRejection) {
      toast.error("All checklist fields and overall Rating are required.");
      return;
    }

    setIsSubmitting(true);
    // For rejection, we can use a simpler payload
    // But we still need to send the decision and basic data
    try {
      // Prepare checklist data in the format expected by API
      const checklistData = {};
      checklistCategories.forEach((category) => {
        const categoryData = {};
        category.items.forEach((item) => {
          const key = `${category.name}-${item.id}`;
          categoryData[item.name] = checkedItems[key] || false;
        });
        if (Object.keys(categoryData).length > 0) {
          checklistData[category.name] = categoryData;
        }
      });

      // Prepare inspection data for rejection
      const inspectionData = {
        decision: "REJECTED",
        admin_feedback: finalNotes || "Inspection rejected by manager.",
        checklist_data: checklistData,
        inspection_images: files,
        overall_rating: parseFloat(overallRatingRejection),
      };

      // Submit inspection rejection
      const response = await managerService.performInspection(auctionData?.id, inspectionData);
      toast.success("Inspection rejected successfully!");

      // Navigate after a short delay to allow toast to be visible
      setTimeout(() => {
        navigate("/manager/dashboard");
      }, 1000);
    } catch (error) {
      console.error("Error submitting inspection rejection:", error);
      const errorMessage = error.response?.data?.message ||
        error.response?.data?.error ||
        error.message ||
        "Failed to submit inspection rejection. Please try again.";
      toast.error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Get specific data for display (e.g., make, model, year for vehicles)
  const getSpecificData = () => {
    if (!auctionData?.specific_data) return {};
    return auctionData.specific_data;
  };

  const specificData = getSpecificData();

  return (
    <div className="inspection-dashboard">
      <main className="inspection-main">
        <div className="inspection-container">
          <div className="inspection-page">
            <div className="inspection-header">
              <div className="welcome-content">
                <h1 className="welcome-title">{categoryName} Inspection Review</h1>
                <p className="welcome-subtitle">Review and approve {categoryName.toLowerCase()} inspection details</p>
              </div>
              {
                isStart ? (
                  <div className="inspection-actions">
                    <button
                      type="button"
                      className="action-button secondary"
                      onClick={handleReject}
                      disabled={isSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                       Reject
                    </button>
                    <button
                      type="button"
                      className="action-button primary"
                      onClick={handleApprove}
                      disabled={isSubmitting}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                     Approve Inspection
                    </button>
                  </div>
                ) : (
                  <div className="inspection-actions">
                    <button className="action-button primary" onClick={() => navigate('/manager/dashboard')}>
                      Go Back
                    </button>
                  </div>
                )
              }
            </div>

            <div className="inspection-layout">
              <div className="inspection-left">
                <div className="vehicle-image-section">
                  {images?.length > 0 ? (
                    <>
                      <div className="vehicle-main-image">
                        <img
                          src={images?.[mainImage] || images?.[0]}
                          alt={itemTitle}
                          className="main-image"
                          onClick={() => setImagePreview(images?.[mainImage] || images?.[0])}
                        />
                      </div>
                      {images?.length > 1 && (
                        <div className="vehicle-thumbnails">
                          {images?.map((img, index) => (
                            <div
                              key={index}
                              className={`thumbnail-container ${mainImage === index ? 'active' : ''}`}
                              onClick={() => setMainImage(index)}
                            >
                              <img src={img} alt={`Thumbnail ${index + 1}`} />
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="vehicle-main-image">
                      <div className="no-image-placeholder">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                        <p>No images available</p>
                      </div>
                    </div>
                  )}

                  <div className="vehicle-details">
                    <h3 className="vehicle-title">{itemTitle}</h3>
                    {itemDescription && (
                      <p className="vehicle-description">{itemDescription}</p>
                    )}
                    <div className="vehicle-meta">
                      <div className="meta-item">
                        <span className="meta-label">Item ID:</span>
                        <span className="meta-value">{itemId}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Category:</span>
                        <span className="meta-value">{categoryName}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Seller:</span>
                        <span className="meta-value">{sellerName}</span>
                      </div>
                      <div className="meta-item">
                        <span className="meta-label">Assigned Manager:</span>
                        <span className="meta-value">{managerName}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="inspection-right">
                {isStart ? (
                  <div className="inspection-form">
                    <div className="form-section">
                      <div className="form-header">
                        <h3>Inspection Checklist</h3>
                        <p className="form-subtitle">Review and provide feedback for each category</p>
                      </div>

                      {loadingChecklist ? (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#39AE47' }}>
                          Loading checklist...
                        </div>
                      ) : checklistCategories.length > 0 ? (
                        <div className="inspection-accordions">
                          {checklistCategories.map((category, categoryIndex) => {
                            const accordionIndex = categoryIndex + 1;
                            return (
                              <div key={category.id} className="accordion-item">
                                <div className="accordion-header" onClick={() => toggle(accordionIndex)}>
                                  <div className="accordion-title">
                                    <div className="accordion-icon">
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                        <path d="M12 6V12L16 14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    </div>
                                    <span>{category.name}</span>
                                    {category.items.length > 0 && (
                                      <span style={{ marginLeft: '0.5rem', fontSize: '0.875rem', opacity: 0.7 }}>
                                        ({category.items.filter(item => checkedItems[`${category.name}-${item.id}`]).length}/{category.items.length})
                                      </span>
                                    )}
                                  </div>
                                  <div className="accordion-arrow">
                                    {open === accordionIndex ? (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    ) : (
                                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                        <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      </svg>
                                    )}
                                  </div>
                                </div>
                                {open === accordionIndex && (
                                  <div className="accordion-content">
                                    {category.items.length > 0 ? (
                                      <div className="checklist-items-container">
                                        {category.items.map((item) => {
                                          const checkboxKey = `${category.name}-${item.id}`;
                                          const isChecked = checkedItems[checkboxKey] || false;
                                          return (
                                            <div key={item.id} className="checklist-item-row">
                                              <label className="checklist-checkbox-label">
                                                <input
                                                  type="checkbox"
                                                  checked={isChecked}
                                                  onChange={() => handleCheckboxChange(category.name, item.name, item.id)}
                                                  className="checklist-checkbox"
                                                />
                                                <span className="checklist-item-text">{item.name}</span>
                                              </label>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    ) : (
                                      <div className="checklist-empty">No items in this category</div>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })}

                          {/* Upload Inspection Images section */}
                          <div className="accordion-item">
                            <div className="accordion-header" onClick={() => toggle(999)}>
                              <div className="accordion-title">
                                <div className="accordion-icon">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span>Upload Inspection Images</span>
                                {uploadedImages.length > 0 && (
                                  <span className="upload-count">{uploadedImages.length}</span>
                                )}
                              </div>
                              <div className="accordion-arrow">
                                {open === 999 ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            {open === 999 && (
                              <div className="accordion-content">
                                <div className="upload-section">
                                  <div className="upload-area" onClick={() => document.getElementById('file-upload').click()}>
                                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none">
                                      <path d="M21 15V19C21 19.5304 20.7893 20.0391 20.4142 20.4142C20.0391 20.7893 19.5304 21 19 21H5C4.46957 21 3.96086 20.7893 3.58579 20.4142C3.21071 20.0391 3 19.5304 3 19V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M17 8L12 3L7 8" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                      <path d="M12 3V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    <p>Click to upload inspection images</p>
                                    <span className="upload-hint">Images • JPG, PNG, JPEG</span>
                                    <input
                                      id="file-upload"
                                      type="file"
                                      multiple
                                      accept="image/*"
                                      onChange={handleFileUpload}
                                      style={{ display: 'none' }}
                                    />
                                  </div>

                                  {uploadedImages.length > 0 && (
                                    <div className="uploaded-images">
                                      <h4 className="uploaded-title">Uploaded Images</h4>
                                      <div className="image-grid">
                                        {uploadedImages.map((image) => (
                                          <div key={image.id} className="uploaded-image-item">
                                            <img src={image.url} alt={image.name} />
                                            <button
                                              className="remove-image"
                                              onClick={() => removeUploadedImage(image.id)}
                                              aria-label="Remove image"
                                            >
                                              <svg width="12" height="12" viewBox="0 0 24 24" fill="none">
                                                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                              </svg>
                                            </button>
                                          </div>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>

                          {/* Final Assessment & Notes section */}
                          <div className="accordion-item">
                            <div className="accordion-header" onClick={() => toggle(1000)}>
                              <div className="accordion-title">
                                <div className="accordion-icon">
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M12 22C17.5228 22 22 17.5228 22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M12 16V12M12 8H12.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                                <span>Final Assessment & Notes</span>
                              </div>
                              <div className="accordion-arrow">
                                {open === 1000 ? (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 15L12 9L18 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                ) : (
                                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                                    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                            </div>
                            {open === 1000 && (
                              <div className="accordion-content">
                                <div className="form-group">
                                  <label className="form-label">Final Inspection Summary</label>
                                  <textarea
                                    className="form-textarea"
                                    rows="5"
                                    placeholder="Provide your final assessment and recommendations..."
                                    value={finalNotes}
                                    onChange={(e) => setFinalNotes(e.target.value)}
                                  />
                                </div>
                              </div>
                            )}
                          </div>
                          <div className="approval-form-group">
                            <label className="approval-form-label">
                              Overall Rating For Rejection <span className="required">*</span>
                            </label>
                            <input
                              type="number"
                              className="approval-form-input"
                              placeholder="e.g., 8.5"
                              min="0"
                              max="10"
                              step="0.1"
                              value={overallRatingRejection}
                              onChange={(e) => setOverallRatingRejection(e.target.value)}
                              required
                            />
                          </div>
                        </div>
                      ) : (
                        <div style={{ padding: '2rem', textAlign: 'center', color: '#39AE47' }}>
                          No checklist available for this category.
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="inspection-form">
                    <div className="form-header">
                      <h3>Inspection Report</h3>
                      <p className="form-subtitle">Review and check the rejection reason.</p>
                    </div>
                    <div className="inspection-accordions">
                      <div className="rejection-report">
                        <div className="rejection-section row-status">
                          <h4 className="rejection-title">Inspection Status</h4>
                          <p className="rejection-status">❌ Rejected</p>
                        </div>

                        <div className="rejection-section">
                          <h4 className="rejection-title">Reason for Rejection</h4>
                          <p className="rejection-text">
                            {auctionData?.rejection_reason || 'The item did not meet the minimum inspection requirements set by the management.'}
                          </p>
                        </div>

                        <div className="rejection-section">
                          <h4 className="rejection-title">Reviewed By</h4>
                          <p className="rejection-text">
                            {managerName}<br />
                            Date: {auctionData?.updated_at ? new Date(auctionData.updated_at).toLocaleDateString() : new Date().toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* New Approval Details Section */}
            {isStart && (
              <div className="approval-details-section">
                <div className="approval-details-header">
                  <h3>Approval Details</h3>
                  <p className="approval-subtitle">Fill in the required information to approve this inspection</p>
                </div>
                <div className="approval-details-form">
                  <div className="approval-form-grid">
                    <div className="approval-form-group">
                      <label className="approval-form-label">
                        Overall Rating For Approval <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        className="approval-form-input"
                        placeholder="e.g., 8.5"
                        min="0"
                        max="10"
                        step="0.1"
                        value={overallRating}
                        onChange={(e) => setOverallRating(e.target.value)}
                        required
                      />
                    </div>

                    <div className="approval-form-group">
                      <label className="approval-form-label">
                        Initial Price <span className="required">*</span>
                      </label>
                      <input
                        type="number"
                        className="approval-form-input"
                        placeholder="e.g., 5000.00"
                        min="0"
                        step="0.01"
                        value={initialPrice}
                        onChange={(e) => setInitialPrice(e.target.value)}
                        required
                      />
                    </div>

                    <div className="approval-form-group">
                      <label className="approval-form-label">
                        Start Date <span className="required">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="approval-form-input"
                        value={startDate}
                        onChange={(e) => setStartDate(e.target.value)}
                        required
                      />
                    </div>

                    <div className="approval-form-group">
                      <label className="approval-form-label">
                        End Date <span className="required">*</span>
                      </label>
                      <input
                        type="datetime-local"
                        className="approval-form-input"
                        value={endDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </main>

      {imagePreview && (
        <div className="image-preview-modal" onClick={() => setImagePreview(null)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setImagePreview(null)}>
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M18 6L6 18M6 6L18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <img src={imagePreview} alt="Preview" />
          </div>
        </div>
      )}
    </div>
  );
};

export default ManagerInspection;
