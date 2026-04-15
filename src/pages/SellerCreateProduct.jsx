import React, { useEffect, useState, useMemo, useRef } from 'react';
import { Link, useNavigate, useParams, useLocation } from 'react-router-dom';
import './SellerCreateProduct.css';
import { useSelector, useDispatch } from 'react-redux';
import { createAuction, updateAuction, fetchMyAuctions } from '../store/actions/sellerActions';
import { fetchCategories } from '../store/actions/AuctionsActions';
import { fetchProfile } from '../store/actions/profileActions';
import { toast } from 'react-toastify';
import { getCurrentLocation } from '../utils/location';
import { getMediaUrl } from '../config/api.config';

const SellerCreateProduct = () => {
  // const { id } = useParams();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const location = useLocation();
  const auctionList = location?.state || {};
  const isUpdating = auctionList?.isEditing || false;
  const auctionData = auctionList?.listingData;

  // console.log('auction id in create product: ', id, auctionList);
  const { categories, isLoading } = useSelector(state => state.buyer);
  const { isCreating } = useSelector(state => state.seller || {});
  const { profile: profileData, loading: profileLoading } = useSelector(state => state.profile || {});
  const [selectedCategory, setSelectedCategory] = useState('');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    handover_type: 'PICKUP',
    pickup_address: '',
    pickup_latitude: '',
    pickup_longitude: '',
    seller_expected_price: '',
    delivery_datetime: "2026-01-10T14:30:00.000Z"
  });
  const [specificData, setSpecificData] = useState({});
  const [mediaFiles, setMediaFiles] = useState([]);
  const [mediaLabels, setMediaLabels] = useState([]);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [selectedAuction, setSelectedAuction] = useState(auctionData || null);

  useEffect(() => {
    if (selectedAuction) {
      setSelectedCategory(selectedAuction.category?.toString() || '');
    }
  }, [selectedAuction])

  // Handover type options
  const handoverTypes = [
    { value: 'PICKUP', label: 'Pickup' },
    { value: 'DELIVERY', label: 'Delivery' },
  ];

  useEffect(() => {
    dispatch(fetchMyAuctions());
  }, [dispatch]);

  // Fetch categories on mount
  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  // Fetch profile to check KYC status
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Check KYC verification status
  const isKycVerified = useMemo(() => {
    return profileData?.seller_profile?.verified === true;
  }, [profileData]);


  // useEffect(() => {
  //   if (isUpdating && selectedAuction) {
  //     setSelectedCategory(selectedAuction.category?.toString() || '');
  //     setFormData(prev => ({
  //       ...prev,
  //       title: selectedAuction.title || '',
  //       description: selectedAuction.description || '',
  //       handover_type: selectedAuction.handover_type || 'PICKUP',
  //       pickup_address: selectedAuction.pickup_address || '',
  //       pickup_latitude: selectedAuction.pickup_latitude || '',
  //       pickup_longitude: selectedAuction.pickup_longitude || '',

  //       seller_expected_price: selectedAuction.seller_expected_price || '',
  //       delivery_datetime: selectedAuction.delivery_datetime || 7,
  //       mediaFiles: selectedAuction.media || [],
  //     }));


  //     const existingMedia = (selectedAuction.media || []).map(item => ({
  //       id: item.id,
  //       url: item.file,          // ✅ backend image URL
  //       label: item.label,
  //       media_type: item.media_type,
  //       isExisting: true,
  //     }));

  //     setMediaFiles(existingMedia);
  //     setMediaLabels(existingMedia.map(m => m.label));
  //     setSpecificData(selectedAuction.specific_data || {});

  //     setSpecificData(selectedAuction.specific_data || {});


  //     console.log("selectedAuction: ", selectedAuction);

  //   }
  // }, [isUpdating, selectedAuction]);



  useEffect(() => {
    if (isUpdating && selectedAuction) {
      // Set category
      setSelectedCategory(selectedAuction.category?.toString() || '');

      // Set form data
      setFormData({
        title: selectedAuction?.title || '',
        description: selectedAuction?.description || '',
        handover_type: selectedAuction?.handover_type || 'PICKUP',
        pickup_address: selectedAuction?.pickup_address || '',
        pickup_latitude: selectedAuction?.pickup_latitude?.toString() || '',
        pickup_longitude: selectedAuction?.pickup_longitude?.toString() || '',
        seller_expected_price: selectedAuction?.seller_expected_price?.toString() || '',
        delivery_datetime: selectedAuction?.delivery_datetime
          ? new Date(selectedAuction?.delivery_datetime).toISOString().slice(0, 16)
          : new Date(Date.now() + 10 * 60000).toISOString().slice(0, 16),
      });

      // Set specific data
      setSpecificData(selectedAuction?.specific_data || {});

      // Set media files
      if (selectedAuction.media && selectedAuction.media.length > 0) {
        const existingMedia = selectedAuction.media.map(item => ({
          id: item.id,
          url: getMediaUrl(item.file),
          label: item.label || `gallery_${item.id}`,
          media_type: item.media_type,
          isExisting: true,
        }));

        setMediaFiles(existingMedia);
        setMediaLabels(existingMedia.map(m => m.label));
      }

      console.log('Loaded auction for editing:', selectedAuction);
    }
  }, [isUpdating, selectedAuction]);

  console.log(selectedAuction, 'Selected auction in create product');


  // Get selected category object
  const categoryObject = useMemo(() => {
    if (!selectedCategory || !categories) return null;
    return categories.find(cat => cat.id.toString() === selectedCategory.toString());
  }, [selectedCategory, categories]);

  /////////////
  const isValidLatitude = (lat) => {
    const value = parseFloat(lat);
    return !isNaN(value) && value >= -90 && value <= 90;
  };

  const isValidLongitude = (lng) => {
    const value = parseFloat(lng);
    return !isNaN(value) && value >= -180 && value <= 180;
  };
  ////////////////
  const handleUseLiveLocation = async () => {
    try {
      const { latitude, longitude } = await getCurrentLocation();

      setFormData(prev => ({
        ...prev,
        pickup_latitude: latitude.toFixed(6),
        pickup_longitude: longitude.toFixed(6),
      }));

      toast.success('Location fetched successfully');
    } catch (error) {
      switch (error.code) {
        case error.PERMISSION_DENIED:
          toast.error('Location permission denied');
          break;
        case error.POSITION_UNAVAILABLE:
          toast.error('Location unavailable. Turn on GPS.');
          break;
        case error.TIMEOUT:
          toast.error('Location request timed out. Try again.');
          break;
        default:
          toast.error('Failed to get location');
      }
    }
  };

  // Get validation schema for selected category
  const validationSchema = useMemo(() => {
    return categoryObject?.validation_schema || {};
  }, [categoryObject]);

  // Get sorted fields (required first, then optional)
  const sortedFields = useMemo(() => {
    const fields = Object.entries(validationSchema);
    const required = fields.filter(([_, config]) => config.required);
    const optional = fields.filter(([_, config]) => !config.required);
    return [...required, ...optional];
  }, [validationSchema]);

  // Handle category change
  const handleCategoryChange = (e) => {
    const newCategory = e.target.value;
    setSelectedCategory(newCategory);
    setSpecificData({});
    setErrors({});
    setTouched({});
  };

  // Handle main form field change
  const handleFormFieldChange = (fieldName, value) => {

    setFormData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };


  // useEffect(() => {
  //   if (!formData.delivery_datetime) {
  //     const defaultTime = new Date(Date.now() + 10 * 60000)
  //       .toISOString()
  //       .slice(0, 16);

  //     setFormData(prev => ({
  //       ...prev,
  //       delivery_datetime: defaultTime,
  //     }));
  //   }
  // }, []);

  // Handle specific data field change
  const handleSpecificDataChange = (fieldName, value) => {
    setSpecificData(prev => ({
      ...prev,
      [fieldName]: value
    }));

    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };

  // Handle field blur
  const handleFieldBlur = (fieldName, value, isSpecificData = false) => {
    setTouched(prev => ({
      ...prev,
      [fieldName]: true
    }));

    if (isSpecificData) {
      validateSpecificField(fieldName, value);
    } else {
      validateMainField(fieldName, value);
    }
  };

  // Validate main form field
  const validateMainField = (fieldName, value) => {
    let error = '';

    switch (fieldName) {
      case 'title':
        if (!value || value.trim() === '') {
          error = 'Title is required';
        } else if (value.length < 5) {
          error = 'Title must be at least 5 characters';
        }
        break;
      case 'description':
        if (!value || value.trim() === '') {
          error = 'Description is required';
        } else if (value.length < 10) {
          error = 'Description must be at least 10 characters';
        }
        break;
      case 'pickup_address':
        if (formData.handover_type === 'PICKUP' || formData.handover_type === 'DELIVERY') {
          if (!value || value.trim() === '') {
            error = 'Pickup address is required for pickup option';
          }
        }
        break;
      case 'seller_expected_price':
        if (!value || value.trim() === '') {
          error = 'Starting price is required';
        } else if (isNaN(value) || parseFloat(value) <= 0) {
          error = 'Starting price must be a positive number';
        }
        break;
      case 'delivery_datetime':
        if (!value) {
          error = 'Auction start time is required';
        } else if (new Date(value) <= new Date()) {
          error = 'Auction start time must be in the future';
        }
        break;
      default:
        break;
    }

    if (error) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: error
      }));
      return false;
    }

    if (errors[fieldName]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }

    return true;
  };

  // Validate specific data field
  const validateSpecificField = (fieldName, value) => {
    const fieldConfig = validationSchema[fieldName];
    if (!fieldConfig) return true;

    if (fieldConfig.required && (!value || value.toString().trim() === '')) {
      setErrors(prev => ({
        ...prev,
        [fieldName]: `${formatFieldLabel(fieldName)} is required`
      }));
      return false;
    }

    if (value && (fieldConfig.type === 'number' || fieldConfig.type === 'integer')) {
      if (isNaN(value)) {
        setErrors(prev => ({
          ...prev,
          [fieldName]: `${formatFieldLabel(fieldName)} must be a number`
        }));
        return false;
      }
    }

    return true;
  };

  // Validate all fields
  const validateForm = () => {
    const newErrors = {};
    let isValid = true;

    // Validate main form fields
    if (!formData.title || formData.title.trim() === '') {
      newErrors.title = 'Title is required';
      isValid = false;
    }

    if (!formData.description || formData.description.trim() === '') {
      newErrors.description = 'Description is required';
      isValid = false;
    }

    if ((formData.handover_type === 'PICKUP' || formData.handover_type === 'BOTH') &&
      (!formData.pickup_address || formData.pickup_address.trim() === '')) {
      newErrors.pickup_address = 'Pickup address is required for pickup option';
      isValid = false;
    }

    if (!formData.seller_expected_price || isNaN(formData.seller_expected_price) || parseFloat(formData.seller_expected_price) <= 0) {
      newErrors.seller_expected_price = 'Starting price must be a positive number';
      isValid = false;
    }

    if (!formData.delivery_datetime || isNaN(formData.delivery_datetime) ||
      parseInt(formData.delivery_datetime) < 1 || parseInt(formData.delivery_datetime) > 30) {
      newErrors.delivery_datetime = 'Duration must be between 1 and 30 days';
      isValid = false;
    }

    // Validate specific data fields
    Object.entries(validationSchema).forEach(([fieldName, fieldConfig]) => {
      const value = specificData[fieldName];

      if (fieldConfig.required && (!value || value.toString().trim() === '')) {
        newErrors[fieldName] = `${formatFieldLabel(fieldName)} is required`;
        isValid = false;
      }

      if (value && (fieldConfig.type === 'number' || fieldConfig.type === 'integer')) {
        if (isNaN(value)) {
          newErrors[fieldName] = `${formatFieldLabel(fieldName)} must be a number`;
          isValid = false;
        }
      }
    });

    // Validate at least one image is uploaded (optional based on your requirements)
    if (mediaFiles.length === 0) {
      newErrors.media = 'At least one image is required';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  // Format field name to label
  const formatFieldLabel = (fieldName) => {
    return fieldName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Get input type based on field type
  const getInputType = (fieldType) => {
    switch (fieldType) {
      case 'number':
      case 'integer':
        return 'number';
      case 'string':
      case 'text':
      default:
        return 'text';
    }
  };

  // Handle file upload
  // const handleFileUpload = (e) => {
  //   const files = Array.from(e.target.files);
  //   const newMediaFiles = [...mediaFiles];
  //   const newMediaLabels = [...mediaLabels];

  //   files.forEach((file, index) => {
  //     if (file.type.startsWith('image/')) {
  //       newMediaFiles.push(file);
  //       newMediaLabels.push(`gallery_${mediaFiles.length + index + 1}`);
  //     }
  //   });

  //   setMediaFiles(newMediaFiles);
  //   setMediaLabels(newMediaLabels);

  //   // Clear file input
  //   if (fileInputRef.current) {
  //     fileInputRef.current.value = '';
  //   }
  // };


  const handleFileUpload = (e) => {
    const files = Array.from(e.target.files);
    const newMediaFiles = [...mediaFiles];
    const newMediaLabels = [...mediaLabels];

    files.forEach((file, index) => {
      if (file.type.startsWith('image/')) {
        // Calculate the next gallery number
        const existingCount = newMediaFiles.filter(f => !f.isExisting).length;
        const totalCount = newMediaFiles.length;

        newMediaFiles.push(file);
        newMediaLabels.push(`gallery_${totalCount + index + 1}`);
      }
    });

    setMediaFiles(newMediaFiles);
    setMediaLabels(newMediaLabels);

    // Clear media error if it exists
    if (errors.media) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.media;
        return newErrors;
      });
    }

    // Clear file input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Remove uploaded file
  const handleRemoveFile = (index) => {
    const newMediaFiles = [...mediaFiles];
    const newMediaLabels = [...mediaLabels];

    newMediaFiles.splice(index, 1);
    newMediaLabels.splice(index, 1);

    setMediaFiles(newMediaFiles);
    setMediaLabels(newMediaLabels);
  };


  // Render specific field based on type
  const renderSpecificField = (fieldName, fieldConfig) => {
    const label = formatFieldLabel(fieldName);
    const value = specificData[fieldName] || '';
    const error = touched[fieldName] && errors[fieldName];

    // Enum field (dropdown)
    if (fieldConfig.enum && Array.isArray(fieldConfig.enum)) {
      return (
        <div key={fieldName} className="create-auction-form-group">
          <label className="create-auction-form-label">
            {label} {fieldConfig.required && <span className="create-auction-required-mark">*</span>}
          </label>
          <select
            name={fieldName}
            value={value}
            onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
            onBlur={() => handleFieldBlur(fieldName, value, true)}
            className={`create-auction-form-select ${error ? 'create-auction-form-error' : ''}`}
            required={fieldConfig.required}
          >
            <option value="">Select {label}</option>
            {fieldConfig.enum.map(option => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          {error && <span className="create-auction-error-text">{error}</span>}
        </div>
      );
    }

    // Textarea field
    if (fieldConfig.type === 'textarea') {
      return (
        <div key={fieldName} className="create-auction-form-group create-auction-form-group-full">
          <label className="create-auction-form-label">
            {label} {fieldConfig.required && <span className="create-auction-required-mark">*</span>}
          </label>
          <textarea
            name={fieldName}
            value={value}
            onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
            onBlur={() => handleFieldBlur(fieldName, value, true)}
            className={`create-auction-form-textarea ${error ? 'create-auction-form-error' : ''}`}
            rows="4"
            placeholder={`Enter ${label.toLowerCase()}...`}
            required={fieldConfig.required}
          />
          {error && <span className="create-auction-error-text">{error}</span>}
        </div>
      );
    }

    // Range field (slider with number input)
    if (fieldConfig.type === 'range') {
      return (
        <div key={fieldName} className="create-auction-form-group">
          <label className="create-auction-form-label">
            {label} {fieldConfig.required && <span className="create-auction-required-mark">*</span>}
          </label>
          <div className="create-auction-range-container">
            <input
              type="range"
              name={fieldName}
              value={value}
              onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
              onBlur={() => handleFieldBlur(fieldName, value, true)}
              className="create-auction-range-slider"
              min={fieldConfig.min || 0}
              max={fieldConfig.max || 100}
              required={fieldConfig.required}
            />
            <input
              type="number"
              value={value}
              onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
              onBlur={() => handleFieldBlur(fieldName, value, true)}
              className={`create-auction-range-value ${error ? 'create-auction-form-error' : ''}`}
              min={fieldConfig.min || 0}
              max={fieldConfig.max || 100}
              required={fieldConfig.required}
            />
          </div>
          {error && <span className="create-auction-error-text">{error}</span>}
        </div>
      );
    }

    // Default: text/number input
    return (
      <div key={fieldName} className="create-auction-form-group">
        <label className="create-auction-form-label">
          {label} {fieldConfig.required && <span className="create-auction-required-mark">*</span>}
        </label>
        <input
          type={getInputType(fieldConfig.type)}
          name={fieldName}
          value={value}
          onChange={(e) => handleSpecificDataChange(fieldName, e.target.value)}
          onBlur={() => handleFieldBlur(fieldName, value, true)}
          className={`create-auction-form-input ${error ? 'create-auction-form-error' : ''}`}
          placeholder={`Enter ${label.toLowerCase()}...`}
          required={fieldConfig.required}
          {...(fieldConfig.type === 'number' || fieldConfig.type === 'integer'
            ? { step: fieldConfig.type === 'integer' ? '1' : 'any' }
            : {})}
        />
        {error && <span className="create-auction-error-text">{error}</span>}
      </div>
    );
  };

  // Handle save as draft
  // const handleSaveAsDraft = async (e) => {
  //   e.preventDefault();

  //   // Check KYC verification
  //   if (!isKycVerified && !isUpdating) {
  //     toast.error('Please verify your KYC to create auctions');
  //     navigate('/seller/profile');
  //     return;
  //   }

  //   if (mediaFiles.length === 0) {
  //     toast.error('Please upload at least one image before saving');
  //     setErrors(prev => ({
  //       ...prev,
  //       media: 'At least one image is required'
  //     }));

  //     // Scroll to media upload section
  //     const mediaSection = document.querySelector('.create-auction-media-upload');
  //     if (mediaSection) {
  //       mediaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
  //     }
  //     return;
  //   }

  //   if (!selectedCategory) {
  //     toast.error('Please select a category');
  //     return;
  //   }

  //   try {
  //     const auctionData = {
  //       category: parseInt(selectedCategory),
  //       title: formData.title || 'Draft Listing',
  //       description: formData.description || '',
  //       handover_type: formData.handover_type,
  //       specific_data: specificData,
  //       media: mediaFiles,
  //       media_labels: mediaLabels,
  //       status: 'DRAFT',

  //       ...(formData.
  //         seller_expected_price
  //         && {

  //         seller_expected_price
  //           : parseFloat(formData.
  //             seller_expected_price
  //           ),
  //       }),

  //       ...(formData.delivery_datetime && {
  //         delivery_datetime: new Date(formData.delivery_datetime).toISOString(),
  //       }),

  //       ...(formData.pickup_latitude &&
  //         isValidLatitude(formData.pickup_latitude) && {
  //         pickup_latitude: parseFloat(formData.pickup_latitude),
  //       }),

  //       ...(formData.pickup_longitude &&
  //         isValidLongitude(formData.pickup_longitude) && {
  //         pickup_longitude: parseFloat(formData.pickup_longitude),
  //       }),
  //     };

  //     // Add conditional fields for draft
  //     if (formData.handover_type === 'PICKUP' || formData.handover_type === 'BOTH') {
  //       auctionData.pickup_address = formData.pickup_address || '';
  //     }

  //     await dispatch(createAuction(auctionData));
  //     // log('Draft saved:', result);
  //     toast.success('Draft saved successfully!');

  //     setFormData({
  //       title: '',
  //       description: '',
  //       handover_type: 'PICKUP',
  //       pickup_address: '',
  //       pickup_latitude: '',
  //       pickup_longitude: '',
  //       seller_expected_price: '',
  //       delivery_datetime: "2026-01-10T14:30:00.000Z"
  //     })

  //     navigate('/seller/auction-listings');
  //   } catch (error) {
  //     console.error('Draft save error:', error);
  //     toast.error(error.message || 'Failed to save draft');
  //   }
  // };


  const handleSaveAsDraft = async (e) => {
    e.preventDefault();

    // Check KYC verification
    // if (!isKycVerified && !isUpdating) {
    //   toast.error('Please verify your KYC to create auctions');
    //   navigate('/seller/profile');
    //   return;
    // }

    // Validate image upload
    if (mediaFiles.length === 0) {
      toast.error('Please upload at least one image before saving');
      setErrors(prev => ({
        ...prev,
        media: 'At least one image is required'
      }));

      const mediaSection = document.querySelector('.create-auction-media-upload');
      if (mediaSection) {
        mediaSection.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      return;
    }

    if (!selectedCategory) {
      toast.error('Please select a category');
      return;
    }

    try {
      // Prepare media data
      const newMediaFiles = [];
      const newMediaLabels = [];
      const existingMediaIds = [];

      mediaFiles.forEach((file, index) => {
        if (file.isExisting) {
          // Keep existing media
          existingMediaIds.push(file.id);
        } else {
          // New media to upload
          newMediaFiles.push(file);
          newMediaLabels.push(mediaLabels[index] || `gallery_${index + 1}`);
        }
      });

      const auctionData = {
        category: parseInt(selectedCategory),
        title: formData.title || 'Draft Listing',
        description: formData.description || '',
        handover_type: formData.handover_type,
        specific_data: specificData,
        status: 'DRAFT',

        // Handle media correctly for update
        ...(isUpdating && {
          existing_media_ids: existingMediaIds,
        }),

        // Only add new media if there are new files
        ...(newMediaFiles.length > 0 && {
          media: newMediaFiles,
          media_labels: newMediaLabels,
        }),

        ...(formData.seller_expected_price && {
          seller_expected_price: parseFloat(formData.seller_expected_price),
        }),

        ...(formData.delivery_datetime && {
          delivery_datetime: new Date(formData.delivery_datetime).toISOString(),
        }),

        ...(formData.pickup_latitude &&
          isValidLatitude(formData.pickup_latitude) && {
          pickup_latitude: parseFloat(formData.pickup_latitude),
        }),

        ...(formData.pickup_longitude &&
          isValidLongitude(formData.pickup_longitude) && {
          pickup_longitude: parseFloat(formData.pickup_longitude),
        }),
      };

      // Add conditional fields
      if (formData.handover_type === 'PICKUP' || formData.handover_type === 'BOTH') {
        auctionData.pickup_address = formData.pickup_address || '';
      }

      // Dispatch create or update action
      if (isUpdating && selectedAuction?.id) {
        await dispatch(updateAuction({
          auctionId: selectedAuction.id,
          auctionData: auctionData
        })).unwrap();

        toast.success('Auction updated successfully!');
      } else {
        await dispatch(createAuction(auctionData)).unwrap();
        toast.success('Draft saved successfully!');
      }

      // Reset form
      setFormData({
        title: '',
        description: '',
        handover_type: 'PICKUP',
        pickup_address: '',
        pickup_latitude: '',
        pickup_longitude: '',
        seller_expected_price: '',
        delivery_datetime: "2026-01-10T14:30:00.000Z"
      });

      setMediaFiles([]);
      setMediaLabels([]);
      setSpecificData({});
      setSelectedCategory('');

      // Refresh auctions list
      await dispatch(fetchMyAuctions());

      // Navigate back to listings
      navigate('/seller/auction-listings', { replace: true });

    } catch (error) {
      console.error('Save error:', error);
      toast.error(error.message || `Failed to ${isUpdating ? 'update' : 'save'} auction`);
    }
  };

  // Show KYC verification message if not verified
  if (!profileLoading && !isKycVerified && !isUpdating) {
    return (
      <div className="create-auction-page">
        <main className="create-auction-main">
          <div className="create-auction-container">
            <div className="kyc-verification-required">
              <div className="kyc-verification-icon">
                <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#39AE47" strokeWidth="2">
                  <circle cx="12" cy="12" r="10" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M12 16V12M12 8H12.01" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h2 className="kyc-verification-title">KYC Verification Required</h2>
              <p className="kyc-verification-message">
                Please verify your KYC (Know Your Customer) documents to create and upload auctions.
              </p>
              <p className="kyc-verification-submessage">
                Complete your identity verification in your profile settings to unlock auction creation.
              </p>
              <div className="kyc-verification-actions">
                <Link to="/seller/profile" className="action-button primary">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  Verify KYC to Upload Auction
                </Link>
                <Link to="/seller/auction-listings" className="create-auction-secondary-button">
                  Go Back
                </Link>
              </div>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="create-auction-page">
      <main className="create-auction-main">
        <div className="create-auction-container">
          <div className="create-auction-header">
            <div className="create-auction-title-section">
              <h1 className="create-auction-title">
                {isUpdating ? 'Edit Your Auction' : 'Create New Auction'}
                {/* Create New Auction */}
              </h1>
              <p className="create-auction-subtitle">
                {selectedCategory
                  ? `Fill in the ${categoryObject?.name || 'category'} details for your auction`
                  : 'Select a category to begin'}
              </p>
            </div>
            <div className="create-auction-actions">
              <Link to="/seller/auction-listings" className="create-auction-secondary-button">
                Cancel
              </Link>
            </div>
          </div>

          <div className="create-auction-form-container">
            <form onSubmit={handleSaveAsDraft} className="create-auction-form">
              {/* Category Selection */}
              <div className="create-auction-form-section">
                <h2 className="create-auction-form-section-title">Category Selection</h2>
                <div className="create-auction-form-grid">
                  <div className="create-auction-form-group">
                    <label className="create-auction-form-label">
                      Select Category <span className="create-auction-required-mark">*</span>
                      <span className="create-auction-form-hint">Choose the category that best describes your item</span>
                    </label>
                    <select
                      name="category"
                      value={selectedCategory}
                      onChange={handleCategoryChange}
                      className="create-auction-form-select"
                      required
                      disabled={isUpdating}
                    >
                      <option value="">Select a category</option>
                      {categories?.filter(category => category.is_active === true).map(category => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Basic Information Section */}
              {selectedCategory && (
                <div className="create-auction-form-section">
                  <h2 className="create-auction-form-section-title">Basic Information</h2>
                  <div className="create-auction-form-grid">
                    {/* Title */}
                    <div className="create-auction-form-group create-auction-form-group-full">
                      <label className="create-auction-form-label">
                        Auction Title <span className="create-auction-required-mark">*</span>
                        <span className="create-auction-form-hint">Make it descriptive and attractive to buyers</span>
                      </label>
                      <input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={(e) => handleFormFieldChange('title', e.target.value)}
                        onBlur={() => handleFieldBlur('title', formData.title)}
                        className={`create-auction-form-input ${errors.title ? 'create-auction-form-error' : ''}`}
                        placeholder="e.g., Vintage Leather Armchair in Excellent Condition"
                        required
                      />
                      {errors.title && <span className="create-auction-error-text">{errors.title}</span>}
                    </div>

                    {/* Description */}
                    <div className="create-auction-form-group create-auction-form-group-full">
                      <label className="create-auction-form-label">
                        Description <span className="create-auction-required-mark">*</span>
                        <span className="create-auction-form-hint">Include details about condition, dimensions, history, etc.</span>
                      </label>
                      <textarea
                        name="description"
                        value={formData.description}
                        onChange={(e) => handleFormFieldChange('description', e.target.value)}
                        onBlur={() => handleFieldBlur('description', formData.description)}
                        className={`create-auction-form-textarea ${errors.description ? 'create-auction-form-error' : ''}`}
                        rows="6"
                        placeholder="Describe your item in detail..."
                        required
                      />
                      {errors.description && <span className="create-auction-error-text">{errors.description}</span>}
                    </div>

                    {/* Starting Price */}
                    <div className="create-auction-form-group">
                      <label className="create-auction-form-label">
                        Expected Price <span className="create-auction-required-mark">*</span>
                      </label>
                      <input
                        type="number"
                        name="seller_expected_price"
                        value={formData.
                          seller_expected_price
                        }
                        onChange={(e) => handleFormFieldChange('seller_expected_price', e.target.value)}
                        onBlur={() => handleFieldBlur('seller_expected_price', formData.seller_expected_price)}
                        className={`create-auction-form-input ${errors.
                          seller_expected_price
                          ? 'create-auction-form-error' : ''}`}
                        placeholder="0.00"
                        min="0"
                        step="0.01"
                        required
                      />
                      {errors.
                        seller_expected_price
                        && <span className="create-auction-error-text">{errors.
                          seller_expected_price
                        }</span>}
                    </div>


                    {/* Handover Type */}
                    <div className="create-auction-form-group">
                      <label className="create-auction-form-label">
                        Handover Method <span className="create-auction-required-mark">*</span>
                      </label>
                      <select
                        name="handover_type"
                        value={formData.handover_type}
                        onChange={(e) => handleFormFieldChange('handover_type', e.target.value)}
                        onBlur={() => handleFieldBlur('handover_type', formData.handover_type)}
                        className="create-auction-form-select"
                        required
                      >
                        {handoverTypes.map(type => (
                          <option key={type.value} value={type.value}>
                            {type.label}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="create-auction-form-grid create-auction-form-grid-1">
                    {/* Pickup Address (for DELIVERY) */}
                    {(formData.handover_type === 'DELIVERY' && (
                      <>
                        <div className="create-auction-form-group">
                          <label className="create-auction-form-label">
                            Delivery DateTime <span className="create-auction-required-mark">*</span>
                          </label>

                          <input
                            type="datetime-local"
                            name="delivery_datetime"
                            value={formData.delivery_datetime}
                            onChange={(e) =>
                              handleFormFieldChange('delivery_datetime', e.target.value)
                            }
                            onBlur={() =>
                              handleFieldBlur('delivery_datetime', formData.delivery_datetime)
                            }
                            className={`create-auction-form-input ${errors.delivery_datetime ? 'create-auction-form-error' : ''
                              }`}
                            // min={new Date().toISOString().slice(0, 16)}
                            required
                          />

                          {errors.delivery_datetime && (
                            <span className="create-auction-error-text">
                              {errors.delivery_datetime}
                            </span>
                          )}
                        </div>

                      </>
                    )
                    )}
                  </div>

                  {/* Conditional Fields Based on Handover Type */}
                  <div className="create-auction-form-grid create-auction-form-grid-1">
                    {/* Pickup Address (for PICKUP) */}
                    {(formData.handover_type === 'PICKUP' || formData.handover_type === 'BOTH') && (
                      <>
                        <div className="create-auction-form-group create-auction-form-group-full">
                          <label className="create-auction-form-label">
                            Pickup Address <span className="create-auction-required-mark">*</span>
                          </label>
                          <input
                            type="text"
                            name="pickup_address"
                            value={formData.pickup_address}
                            onChange={(e) => handleFormFieldChange('pickup_address', e.target.value)}
                            onBlur={() => handleFieldBlur('pickup_address', formData.pickup_address)}
                            className={`create-auction-form-input ${errors.pickup_address ? 'create-auction-form-error' : ''}`}
                            placeholder="Street address, city, state, zip code"
                            required
                          />
                          {errors.pickup_address && <span className="create-auction-error-text">{errors.pickup_address}</span>}
                        </div>

                        <div className="create-auction-form-group">
                          <label className="create-auction-form-label">
                            Latitude (Optional)
                          </label>
                          <input
                            type="number"
                            name="pickup_latitude"
                            value={formData.pickup_latitude}
                            onChange={(e) => handleFormFieldChange('pickup_latitude', e.target.value)}
                            onBlur={() => {
                              if (
                                formData.pickup_latitude &&
                                !isValidLatitude(formData.pickup_latitude)
                              ) {
                                setErrors(prev => ({
                                  ...prev,
                                  pickup_latitude: 'Latitude must be between -90 and 90'
                                }));
                              }
                            }}
                            className={`create-auction-form-input ${errors.pickup_latitude ? 'create-auction-form-error' : ''}`}
                            placeholder="24.8607"
                            step="any"
                          />
                          {errors.pickup_latitude && (
                            <span className="create-auction-error-text">{errors.pickup_latitude}</span>
                          )}

                        </div>

                        <div className="create-auction-form-group">
                          <label className="create-auction-form-label">
                            Longitude (Optional)
                          </label>
                          <input
                            type="number"
                            name="pickup_longitude"
                            value={formData.pickup_longitude}
                            onChange={(e) => handleFormFieldChange('pickup_longitude', e.target.value)}
                            onBlur={() => {
                              if (
                                formData.pickup_longitude &&
                                !isValidLongitude(formData.pickup_longitude)
                              ) {
                                setErrors(prev => ({
                                  ...prev,
                                  pickup_longitude: 'Longitude must be between -180 and 180'
                                }));
                              }
                            }}
                            className={`create-auction-form-input ${errors.pickup_longitude ? 'create-auction-form-error' : ''}`}
                            placeholder="67.0011"
                            step="any"
                          />
                          {errors.pickup_longitude && (
                            <span className="create-auction-error-text">{errors.pickup_longitude}</span>
                          )}

                        </div>
                        <button
                          type="button"
                          onClick={handleUseLiveLocation}
                          className="create-auction-location-button"
                        >

                          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" strokeLinecap="round" strokeLinejoin="round" />
                            <circle cx="12" cy="10" r="3" />
                          </svg>
                          Use Current Location

                        </button>
                      </>
                    )}

                  </div>
                </div>
              )}

              {/* Category Specific Details */}
              {selectedCategory && sortedFields.length > 0 && (
                <div className="create-auction-form-section">
                  <h2 className="create-auction-form-section-title">
                    {categoryObject?.name} Details
                  </h2>
                  <div className="create-auction-form-grid">
                    {sortedFields.map(([fieldName, fieldConfig]) =>
                      renderSpecificField(fieldName, fieldConfig)
                    )}
                  </div>
                </div>
              )}

              {/* Images Upload Section */}
              {selectedCategory && (
                <div className="create-auction-form-section">
                  <h2 className="create-auction-form-section-title">Images & Documents</h2>

                  {errors.media && (
                    <div className="create-auction-error-message">
                      <span className="create-auction-error-text">{errors.media}</span>
                    </div>
                  )}

                  <div className="create-auction-media-upload">
                    <div className="create-auction-upload-area">
                      <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileUpload}
                        accept="image/*,.pdf,.doc,.docx"
                        multiple
                        className="create-auction-file-input"
                      />
                      <div className="create-auction-upload-placeholder">
                        <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.5)" strokeWidth="1.5">
                          <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M17 8l-5-5-5 5" strokeLinecap="round" strokeLinejoin="round" />
                          <path d="M12 3v12" strokeLinecap="round" strokeLinejoin="round" />
                        </svg>
                        <p className="create-auction-upload-text">Click to upload images or documents</p>
                        <p className="create-auction-upload-hint">Supports JPG, PNG, PDF up to 10MB each</p>
                      </div>
                    </div>

                    {mediaFiles.length > 0 && (
                      <div className="create-auction-media-list">
                        {/* {mediaFiles.map((file, index) => (
                          <div key={index} className="create-auction-media-item">
                            <div className="create-auction-media-preview">
                              {file.type.startsWith('image/') ? (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`Preview ${index + 1}`}
                                  className="create-auction-media-image"
                                />
                              ) : (
                                <div className="create-auction-media-doc">
                                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(255, 255, 255, 0.7)" strokeWidth="2">
                                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M14 2v6h6" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 13H8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M16 17H8" strokeLinecap="round" strokeLinejoin="round" />
                                    <path d="M10 9H8" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                </div>
                              )}
                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="create-auction-media-remove"
                              >
                                ×
                              </button>
                            </div>
                            <div className="create-auction-media-info">
                              <p className="create-auction-media-name">{file.name}</p>
                              <p className="create-auction-media-size">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>
                          </div>
                        ))} */}

                        {mediaFiles.map((file, index) => (
                          <div key={index} className="create-auction-media-item">
                            <div className="create-auction-media-preview">

                              {/* EXISTING IMAGE (FROM BACKEND) */}
                              {file.isExisting && file.media_type === 'image' && (
                                <img
                                  src={file.url}
                                  alt={`Existing ${index}`}
                                  className="create-auction-media-image"
                                />
                              )}

                              {/* NEW IMAGE (FILE OBJECT) */}
                              {!file.isExisting && file.type?.startsWith('image/') && (
                                <img
                                  src={URL.createObjectURL(file)}
                                  alt={`New ${index}`}
                                  className="create-auction-media-image"
                                />
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveFile(index)}
                                className="create-auction-media-remove"
                              >
                                ×
                              </button>

                            </div>
                            <div className="create-auction-media-info">
                              <p className="create-auction-media-name">{file.label}</p>
                              <p className="create-auction-media-size">
                                {file.isExisting ? 'Existing File' : `${(file.size / 1024 / 1024).toFixed(2)} MB`}
                              </p>
                            </div>
                          </div>
                        ))}

                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Empty State */}
              {!selectedCategory && !isLoading && (
                <div className="create-auction-empty-state">
                  <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
                    <path d="M9 11L12 14L22 4" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" strokeLinecap="round" />
                    <path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" stroke="rgba(255, 255, 255, 0.3)" strokeWidth="2" />
                  </svg>
                  <h3 className="create-auction-empty-title">Select a Category to Continue</h3>
                  <p className="create-auction-empty-text">Choose a category from the dropdown above to see the required fields for your auction listing.</p>
                </div>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="create-auction-loading-state">
                  <div className="create-auction-loading-spinner"></div>
                  <p className="create-auction-loading-text">Loading categories...</p>
                </div>
              )}

              {/* Form Actions */}
              {selectedCategory && (
                <div className="create-auction-form-actions">
                  {/* {!isUpdating && ( */}
                  {/* <button
                    type="submit"
                    className="create-auction-secondary-button-action"

                    disabled={isCreating}
                  >
                    {isCreating ? 'Saving...' : isUpdating ? 'Update Auction' : ' Save as Draft'}
                  </button> */}
                  <button
                    type="submit"
                    className="create-auction-secondary-button-action"
                  // disabled={isCreating || isUpdating}
                  >

                    {/* { } */}
                    {isUpdating ? 'Update Auction' : 'Save as Draft'}
                    {/* { isUpdating ? 'Updating...' : 'Save as Draft' } */}
                    {/* {isCreating || isUpdating
                      ? (isUpdating ? 'Updating...' : 'Saving...')
                      : (isUpdating ? 'Update Auction' : )
                    } */}
                  </button>
                  {/* )} */}
                </div>
              )}
            </form>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerCreateProduct;