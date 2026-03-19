import React, { useState, useEffect } from 'react';
import { useLocation, useParams, useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { createCategory, updateCategory, fetchCategories } from '../../store/actions/adminActions';
import { fetchCategories as fetchCategoriesForBuyer } from '../../store/actions/AuctionsActions';
import { toast } from 'react-toastify';
import './ManagerProductFields.css';

const ManagerProductFields = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { categories: categoriesFromStore } = useSelector((state) => state.admin);
  const basePath = location.pathname.startsWith('/manager') ? '/manager' : '/admin';

  // Check if we're in edit mode
  const editingCategoryId = localStorage.getItem('editingCategoryId');
  const isEditMode = !!editingCategoryId;

  const [categoryName, setCategoryName] = useState('');

  // Convert validation_schema to fields format
  const convertValidationSchemaToFields = (validationSchema) => {
    if (!validationSchema || typeof validationSchema !== 'object') {
      return [];
    }

    return Object.entries(validationSchema).map(([key, schema], index) => {
      const fieldName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      const field = {
        id: Date.now() + index,
        name: fieldName,
        type: schema.type === 'string' && schema.enum ? 'select' : (schema.type === 'string' ? 'text' : schema.type) || 'text',
        required: schema.required || false,
        placeholder: '',
        sortOrder: index + 1,
      };

      if (schema.enum && Array.isArray(schema.enum)) {
        field.options = schema.enum;
      }

      return field;
    });
  };

  useEffect(() => {
    // Get category name from localStorage
    const name = localStorage.getItem('pendingCategoryName');
    if (name) {
      setCategoryName(name);
    } else {
      // If no name found, redirect back to category list
      navigate(`${basePath}/category`);
      return;
    }

    // If in edit mode, load existing category fields and increment rules
    if (isEditMode && editingCategoryId) {
      if (categoriesFromStore && Array.isArray(categoriesFromStore)) {
        const category = categoriesFromStore.find(cat => cat.id === parseInt(editingCategoryId));

        if (category && category.validation_schema) {
          const existingFields = convertValidationSchemaToFields(category.validation_schema);
          if (existingFields.length > 0) {
            setFields(existingFields);
          }
        }
        if (category?.increment_rules?.ranges && Array.isArray(category.increment_rules.ranges) && category.increment_rules.ranges.length > 0) {
          const first = category.increment_rules.ranges[0];
          setIncrementRules([{
            up_to: Number(first.up_to) || 0,
            increment: Number(first.increment) || 0,
          }]);
        }
      } else {
        // If categories not loaded yet, fetch them
        dispatch(fetchCategories());
      }
    }
  }, [navigate, basePath, isEditMode, editingCategoryId, categoriesFromStore, dispatch]);

  // Re-check for category after fetching
  useEffect(() => {
    if (isEditMode && editingCategoryId && categoriesFromStore) {
      const category = Array.isArray(categoriesFromStore)
        ? categoriesFromStore.find(cat => cat.id === parseInt(editingCategoryId))
        : null;

      if (category && category.validation_schema) {
        const existingFields = convertValidationSchemaToFields(category.validation_schema);
        if (existingFields.length > 0) {
          setFields(existingFields);
        }
      }
      if (category?.increment_rules?.ranges && Array.isArray(category.increment_rules.ranges) && category.increment_rules.ranges.length > 0) {
        const first = category.increment_rules.ranges[0];
        setIncrementRules([{
          up_to: Number(first.up_to) || 0,
          increment: Number(first.increment) || 0,
        }]);
      }
    }
  }, [categoriesFromStore, isEditMode, editingCategoryId]);

  const [category, setCategory] = useState({
    id: categoryId,
    name: categoryName || 'New Category',
    icon: '🚗',
    iconColor: '#3B82F6'
  });

  // Initialize fields - empty for edit mode (will be loaded), default for create mode
  const [fields, setFields] = useState(() => {
    // If in edit mode, start with empty array (will be populated from API)
    if (localStorage.getItem('editingCategoryId')) {
      return [];
    }
    // Default fields for new categories: Make (compulsory) and Year
    return [
      { id: 1, name: 'Make', type: 'text', required: true, placeholder: 'e.g., Toyota, Honda', sortOrder: 1 },
      { id: 2, name: 'Year', type: 'number', required: false, placeholder: 'e.g., 2020', sortOrder: 2 },
    ];
  });

  const [newField, setNewField] = useState({
    name: '',
    type: 'text',
    required: false,
    placeholder: '',
    options: ''
  });

  const [editingField, setEditingField] = useState(null);
  const [showFieldForm, setShowFieldForm] = useState(false);
  const [errors, setErrors] = useState({});

  // Increment rules for bidding (up_to = max bid for this range, increment = min bid increment)
  const [incrementRules, setIncrementRules] = useState([{ up_to: 1000, increment: 50 }]);

  const fieldTypes = [
    { value: 'text', label: 'Text Field', icon: '📝' },
    { value: 'number', label: 'Number', icon: '🔢' },
    { value: 'select', label: 'Dropdown', icon: '📋' },
    { value: 'checkbox', label: 'Checkbox', icon: '☑️' },
    { value: 'textarea', label: 'Text Area', icon: '📄' },
    { value: 'date', label: 'Date', icon: '📅' },
    { value: 'file', label: 'File Upload', icon: '📎' },
    { value: 'email', label: 'Email', icon: '✉️' },
    { value: 'url', label: 'URL', icon: '🔗' },
    { value: 'color', label: 'Color Picker', icon: '🎨' },
    { value: 'range', label: 'Range Slider', icon: '🎚️' },
    { value: 'tel', label: 'Phone Number', icon: '📞' },
  ];

  const handleNewFieldChange = (e) => {
    const { name, value, type, checked } = e.target;
    setNewField(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const handleOptionsKeyDown = (e) => {
    // Handle Enter key to auto-add comma
    if (e.key === 'Enter' && e.target.name === 'options') {
      const textarea = e.target;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const textAfterCursor = textarea.value.substring(cursorPosition);
      
      const lastNewlineIndex = textBeforeCursor.lastIndexOf('\n');
      const currentLine = lastNewlineIndex === -1 ? textBeforeCursor : textBeforeCursor.substring(lastNewlineIndex + 1);
      
      if (currentLine.trim() && !currentLine.trim().endsWith(',')) {
        e.preventDefault();
        const newValue = textBeforeCursor + ',' + '\n' + textAfterCursor;
        setNewField(prev => ({
          ...prev,
          options: newValue
        }));
        setTimeout(() => {
          textarea.setSelectionRange(cursorPosition + 2, cursorPosition + 2);
        }, 0);
      }
    }
  };

  const validateField = (field) => {
    const newErrors = {};

    if (!field.name.trim()) {
      newErrors.name = 'Field name is required';
    } else if (field.name.length < 2) {
      newErrors.name = 'Field name must be at least 2 characters';
    }

    if (field.type === 'select' && !field.options.trim()) {
      newErrors.options = 'Options are required for dropdown fields';
    }

    return newErrors;
  };

  const handleAddField = () => {
    const errors = validateField(newField);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    const fieldData = {
      id: Date.now(),
      name: newField.name,
      type: newField.type,
      required: newField.required,
      placeholder: newField.placeholder,
      sortOrder: fields.length + 1,
      ...(newField.type === 'select' && {
        options: newField.options.split(/[,\n]/).map(opt => opt.trim()).filter(opt => opt)
      })
    };

    setFields(prev => [...prev, fieldData]);
    setNewField({
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: ''
    });
    setShowFieldForm(false);
    setErrors({});
  };

  const handleEditField = (field) => {
    setEditingField(field);
    setNewField({
      name: field.name,
      type: field.type,
      required: field.required,
      placeholder: field.placeholder || '',
      options: field.options ? field.options.join(',\n') : ''
    });
    setShowFieldForm(true);
  };

  const handleUpdateField = () => {
    const errors = validateField(newField);
    if (Object.keys(errors).length > 0) {
      setErrors(errors);
      return;
    }

    // Make field must remain required - cannot be made optional
    if (editingField?.name.toLowerCase() === 'make' && !newField.required) {
      toast.error('The Make field must remain compulsory.');
      return;
    }

    setFields(prev => prev.map(field =>
      field.id === editingField.id
        ? {
          ...field,
          name: newField.name,
          type: newField.type,
          required: newField.required,
          placeholder: newField.placeholder,
          ...(newField.type === 'select' && {
            options: newField.options.split(/[,\n]/).map(opt => opt.trim()).filter(opt => opt)
          })
        }
        : field
    ));

    setEditingField(null);
    setNewField({
      name: '',
      type: 'text',
      required: false,
      placeholder: '',
      options: ''
    });
    setShowFieldForm(false);
    setErrors({});
  };

  const handleDeleteField = (field) => {
    if (field.name.toLowerCase() === 'make') {
      toast.error('Cannot delete the Make field. It is required for every category.');
      return;
    }
    if (window.confirm('Are you sure you want to delete this field? This will affect all products in this category.')) {
      setFields(prev => prev.filter(f => f.id !== field.id));
    }
  };

  const handleIncrementRuleChange = (index, field, value) => {
    const num = Number(value);
    setIncrementRules((prev) =>
      prev.map((r, i) => (i === index ? { ...r, [field]: isNaN(num) ? 0 : num } : r))
    );
  };


  const handleDragStart = (e, index) => {
    e.dataTransfer.setData('text/plain', index);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleDrop = (e, newIndex) => {
    e.preventDefault();
    const oldIndex = e.dataTransfer.getData('text/plain');

    if (oldIndex !== newIndex) {
      const newFields = [...fields];
      const [movedField] = newFields.splice(oldIndex, 1);
      newFields.splice(newIndex, 0, movedField);

      const updatedFields = newFields.map((field, index) => ({
        ...field,
        sortOrder: index + 1
      }));

      setFields(updatedFields);
    }
  };

  const handleSaveFields = async () => {
    if (!categoryName) {
      alert('Category name is missing. Please go back and enter a category name.');
      return;
    }

    // Make field is compulsory - cannot create/update category without it
    const hasMakeField = fields.some(f => f.name.toLowerCase() === 'make');
    const makeFieldRequired = fields.find(f => f.name.toLowerCase() === 'make')?.required;

    if (!hasMakeField || !makeFieldRequired) {
      toast.error('The Make field is required and must be marked as compulsory. Cannot save without it.');
      return;
    }

    // Build validation_schema from fields
    const validationSchema = {};
    fields.forEach(field => {
      const fieldSchema = { type: field.type === 'select' ? 'string' : field.type };
      
      if (field.required) {
        fieldSchema.required = true;
      }

      if (field.type === 'select' && field.options && field.options.length > 0) {
        fieldSchema.enum = field.options;
      }

      validationSchema[field.name.toLowerCase().replace(/\s+/g, '_')] = fieldSchema;
    });

    const validRules = incrementRules
      .filter((r) => Number(r.up_to) > 0 && Number(r.increment) > 0)
      .map((r) => ({ up_to: Number(r.up_to), increment: Number(r.increment) }))
      .sort((a, b) => a.up_to - b.up_to);

    const categoryData = {
      name: categoryName,
      validation_schema: validationSchema,
      ...(validRules.length > 0 && { increment_rules: { ranges: validRules } }),
    };

    try {
      let createdCategoryId = null;

      if (isEditMode && editingCategoryId) {
        // Update existing category
        await dispatch(updateCategory({ 
          categoryId: parseInt(editingCategoryId), 
          categoryData 
        })).unwrap();
        toast.success('Category updated successfully!');
      } else {
        // Create new category
        await dispatch(createCategory(categoryData)).unwrap();
        toast.success('Category created successfully!');
      }

      // Clear localStorage
      localStorage.removeItem('pendingCategoryName');
      if (isEditMode) {
        localStorage.removeItem('editingCategoryId');
      }
      
      // Refresh categories in both admin and buyer stores (Buy tab uses state.buyer.categories)
      dispatch(fetchCategories());
      dispatch(fetchCategoriesForBuyer());
      
      // Navigate back to category list
      navigate(`${basePath}/category`);
    } catch (error) {
      console.error(`Failed to ${isEditMode ? 'update' : 'create'} category:`, error);
    }
  };

  const getFieldTypeIcon = (type) => {
    const typeInfo = fieldTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.icon : '📝';
  };

  const getFieldTypeLabel = (type) => {
    const typeInfo = fieldTypes.find(t => t.value === type);
    return typeInfo ? typeInfo.label : 'Text Field';
  };

  return (
    <div className="dashboard-page">
      <main className="dashboard-main">
        <div className="dashboard-container">
          <div className="manage-fields-header">
            <div className="category-details">
              <h1 className="manage-field-page-title">Manage Product Fields</h1>
              <p className="manage-field-page-subtitle">
                Configure custom fields for products in <strong>{categoryName || 'New Category'}</strong> category
              </p>
            </div>
            <div className="header-actions">
              <button
                className="field-secondary-btn"
                onClick={() => {
                  // Clear edit mode data when canceling
                  if (isEditMode) {
                    localStorage.removeItem('editingCategoryId');
                    localStorage.removeItem('pendingCategoryName');
                  }
                  navigate(`${basePath}/category`);
                }}
              >
                Back to Categories
              </button>
              <button
                className="primary-action-btn field-primary"
                onClick={handleSaveFields}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                Save All Changes
              </button>
            </div>
          </div>

          <div className="fields-management-section">
            <div className="fields-config-column">
            <div className="section-card">
              <div className="section-header">
                <h3 className="section-title">Current Fields ({fields.length})</h3>
                <div className="section-description">
                  Drag to reorder fields. Required fields will be marked with asterisk (*) on seller forms.
                </div>
              </div>

              <div className="fields-list">
                {fields.map((field, index) => (
                  <div
                    key={field.id}
                    className="field-item"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, index)}
                  >
                    <div className="field-drag-handle">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M8 7H20M8 12H20M8 17H20M4 7V7.01M4 12V12.01M4 17V17.01" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </div>
                    <div className="field-icon">
                      <span className="field-type-icon">{getFieldTypeIcon(field.type)}</span>
                    </div>
                    <div className="field-content">
                      <div className="field-header">
                        <h4 className="field-name">
                          {field.name}
                          {field.required && <span className="required-asterisk">*</span>}
                        </h4>
                        <div className="field-meta">
                          <span className="field-type">{getFieldTypeLabel(field.type)}</span>
                          {field.placeholder && (
                            <span className="field-placeholder">Placeholder: {field.placeholder}</span>
                          )}
                        </div>
                      </div>
                      {field.type === 'select' && field.options && (
                        <div className="field-options">
                          <span className="options-label">Options:</span>
                          <div className="options-list">
                            {field.options.map((option, idx) => (
                              <span key={idx} className="option-tag">{option}</span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="field-actions">
                      <button
                        className="field-action-btn field-edit-btn"
                        onClick={() => handleEditField(field)}
                        title="Edit field"
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                      <button
                        className="field-action-btn field-delete-btn"
                        onClick={() => handleDeleteField(field)}
                        title={field.name.toLowerCase() === 'make' ? 'Make field cannot be deleted' : 'Delete field'}
                        disabled={field.name.toLowerCase() === 'make'}
                      >
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                          <polyline points="3 6 5 6 21 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="section-card increment-rules-section">
              <div className="section-header">
                <h3 className="section-title">Bidding Increment Rules</h3>
                <div className="section-description">
                  Define bid range and minimum increment. E.g., up to 1000 → increment 50.
                </div>
              </div>
              <div className="increment-rules-list">
                <div className="increment-rule-single">
                  <div className="increment-rule-row increment-rule-labels">
                    <label className="form-label">Up To (max bid)</label>
                    <span />
                    <label className="form-label">Increment (min)</label>
                  </div>
                  <div className="increment-rule-row increment-rule-inputs">
                    <input
                      type="number"
                      min="1"
                      value={incrementRules[0]?.up_to ?? ''}
                      onChange={(e) => handleIncrementRuleChange(0, 'up_to', e.target.value)}
                      placeholder="e.g., 1000"
                      className="form-input"
                    />
                    <span className="increment-rule-arrow">→</span>
                    <input
                      type="number"
                      min="1"
                      value={incrementRules[0]?.increment ?? ''}
                      onChange={(e) => handleIncrementRuleChange(0, 'increment', e.target.value)}
                      placeholder="e.g., 50"
                      className="form-input"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className={`field-form-section ${showFieldForm ? 'expanded' : ''}`}>
              <div className="section-card">
                <div className="section-header">
                  <h3 className="section-title">
                    {editingField ? 'Edit Field' : 'Add New Field'}
                  </h3>
                  {!showFieldForm && (
                    <button
                      className="add-field-btn"
                      onClick={() => setShowFieldForm(true)}
                    >
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                        <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                      Add New Field
                    </button>
                  )}
                </div>

                {showFieldForm && (
                  <div className="field-form">
                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label required">Field Name</label>
                        <input
                          type="text"
                          name="name"
                          value={newField.name}
                          onChange={handleNewFieldChange}
                          placeholder="e.g., Model, Serial Number, Condition"
                          className={`form-input ${errors.name ? 'error' : ''}`}
                        />
                        {errors.name && (
                          <span className="error-message">{errors.name}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label className="form-label required">Field Type</label>
                        <div className="field-type-grid">
                          {fieldTypes.map((type) => (
                            <button
                              key={type.value}
                              type="button"
                              className={`field-type-item ${newField.type === type.value ? 'selected' : ''
                                }`}
                              onClick={() => setNewField(prev => ({ ...prev, type: type.value }))}
                            >
                              <span className="type-icon">{type.icon}</span>
                              <span className="type-label">{type.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {newField.type === 'select' && (
                      <div className="form-section">
                        <div className="form-group">
                          <label className="form-label required">Dropdown Options</label>
                          <textarea
                            name="options"
                            value={newField.options}
                            onChange={handleNewFieldChange}
                            placeholder="Enter options separated by commas (e.g., New, Used, Refurbished)"
                            className={`form-textarea ${errors.options ? 'error' : ''}`}
                            rows="3"
                          />
                          {errors.options && (
                            <span className="error-message">{errors.options}</span>
                          )}
                          <div className="textarea-info">
                            <span className="hint-text">Options will appear as dropdown choices</span>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="form-grid">
                      <div className="form-group">
                        <label className="form-label">Placeholder Text</label>
                        <input
                          type="text"
                          name="placeholder"
                          value={newField.placeholder}
                          onChange={handleNewFieldChange}
                          placeholder="Optional hint text for the field"
                          className="form-input"
                        />
                      </div>

                      <div className="form-group">
                        <label className="form-label">Field Settings</label>
                        <div className="field-settings">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              name="required"
                              checked={newField.required}
                              onChange={handleNewFieldChange}
                              className="checkbox-input"
                            />
                            <span className="checkbox-custom"></span>
                            <span className="checkbox-text">Required Field</span>
                          </label>
                        </div>
                      </div>
                    </div>

                    <div className="form-actions">
                      <button
                        type="button"
                        className="field-secondary-btn"
                        onClick={() => {
                          setShowFieldForm(false);
                          setEditingField(null);
                          setNewField({
                            name: '',
                            type: 'text',
                            required: false,
                            placeholder: '',
                            options: ''
                          });
                          setErrors({});
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        className="field-primary-btn"
                        onClick={editingField ? handleUpdateField : handleAddField}
                      >
                        {editingField ? 'Update Field' : 'Add Field'}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </div>

            <div className="preview-section">
              <div className="section-card">
                <div className="section-header">
                  <h3 className="section-title">Seller Form Preview</h3>
                  <div className="section-description">
                    How the fields will appear to sellers when adding products
                  </div>
                </div>

                <div className="preview-form">
                  <div className="preview-header">
                    <h4 className="preview-title">Add New Product - {categoryName || 'New Category'}</h4>
                    <p className="preview-subtitle">Required fields are marked with *</p>
                  </div>

                  <div className="preview-fields">
                    {fields.map(field => (
                      <div key={field.id} className="preview-field">
                        <label className="preview-label">
                          {field.name}
                          {field.required && <span className="required-asterisk">*</span>}
                        </label>
                        {field.type === 'text' && (
                          <input
                            type="text"
                            className="preview-input"
                            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                            disabled
                          />
                        )}
                        {field.type === 'number' && (
                          <input
                            type="number"
                            className="preview-input"
                            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                            disabled
                          />
                        )}
                        {field.type === 'select' && (
                          <select className="preview-select">
                            <option value="">Select {field.name.toLowerCase()}</option>
                            {field.options?.map((option, idx) => (
                              <option key={idx} value={option}>{option}</option>
                            ))}
                          </select>
                        )}
                        {field.type === 'textarea' && (
                          <textarea
                            className="preview-textarea"
                            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                            rows="3"
                            disabled
                          />
                        )}
                        {!['text', 'number', 'select', 'textarea'].includes(field.type) && (
                          <input
                            type="text"
                            className="preview-input"
                            placeholder={field.placeholder || `Enter ${field.name.toLowerCase()}`}
                            disabled
                          />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default ManagerProductFields;