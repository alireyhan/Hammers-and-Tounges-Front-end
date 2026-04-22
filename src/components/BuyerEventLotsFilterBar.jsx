import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { auctionService } from '../services/interceptors/auction.service';
import { fetchCategories } from '../store/actions/AuctionsActions';
import './BuyerEventLotsFilterBar.css';

const formatLabel = (key) =>
  String(key)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());

const FilterSection = ({ title, options, selected, onToggle }) => (
  <div className="buyer-event-lots-filter__section">
    <h3 className="buyer-event-lots-filter__section-title">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="4" y1="6" x2="20" y2="6" />
        <line x1="4" y1="12" x2="14" y2="12" />
        <line x1="4" y1="18" x2="9" y2="18" />
      </svg>
      {title}
    </h3>
    <ul className="buyer-event-lots-filter__list">
      {options.map(([value, count]) => (
        <li key={value} className="buyer-event-lots-filter__item">
          <label className="buyer-event-lots-filter__label">
            <input
              type="checkbox"
              checked={selected.has(value)}
              onChange={() => onToggle(value)}
              className="buyer-event-lots-filter__checkbox"
            />
            <span className="buyer-event-lots-filter__name">{value}</span>
            <span className="buyer-event-lots-filter__count">({count})</span>
          </label>
        </li>
      ))}
    </ul>
  </div>
);

const BuyerEventLotsFilterBar = ({ eventId, lots, facets, onFiltersChange }) => {
  const dispatch = useDispatch();
  const { categories } = useSelector((state) => state.buyer);
  const [selectedFilters, setSelectedFilters] = useState({});
  const [facetsData, setFacetsData] = useState(facets || {});

  useEffect(() => {
    dispatch(fetchCategories());
  }, [dispatch]);

  useEffect(() => {
    if (facets && Object.keys(facets).length > 0) {
      setFacetsData(facets);
      return;
    }
    if (!eventId) {
      setFacetsData({});
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const data = await auctionService.getLotsFacets(eventId);
        if (!cancelled) setFacetsData(data || {});
      } catch {
        if (!cancelled) setFacetsData({});
      }
    })();
    return () => { cancelled = true; };
  }, [eventId, facets]);

  const categoriesList = useMemo(() => {
    const list = Array.isArray(categories) ? categories : categories?.results ?? [];
    const categoryIdsInEvent = new Set(
      lots.map((l) => l.category ?? l.category_id).filter(Boolean)
    );
    return list.filter((c) => categoryIdsInEvent.has(c.id) || categoryIdsInEvent.has(Number(c.id)));
  }, [lots, categories]);

  const allValidationSchemaKeys = useMemo(() => {
    const keys = new Set();
    categoriesList.forEach((cat) => {
      const schema = cat.validation_schema;
      if (schema && typeof schema === 'object') {
        Object.keys(schema).forEach((k) => keys.add(k));
      }
    });
    return Array.from(keys);
  }, [categoriesList]);

  const facetSectionsToShow = useMemo(() => {
    const sections = [];
    if (facetsData.make && Object.keys(facetsData.make).length > 0) {
      sections.push({ key: 'make', label: 'Make', options: Object.entries(facetsData.make) });
    }
    allValidationSchemaKeys.forEach((schemaKey) => {
      if (schemaKey === 'make') return;
      // Requirement: remove "Condition" filter from all event-lots flows
      if (schemaKey === 'condition') return;
      const facetValues = facetsData[schemaKey];
      if (facetValues && typeof facetValues === 'object' && Object.keys(facetValues).length > 0) {
        sections.push({
          key: schemaKey,
          label: formatLabel(schemaKey),
          options: Object.entries(facetValues),
        });
      }
    });
    return sections;
  }, [facetsData, allValidationSchemaKeys]);

  const handleToggle = useCallback(
    (sectionKey, value) => {
      setSelectedFilters((prev) => {
        const section = prev[sectionKey] || new Set();
        const next = new Set(section);
        if (next.has(value)) next.delete(value);
        else next.add(value);
        const nextState = { ...prev, [sectionKey]: next };
        onFiltersChange?.(nextState);
        return nextState;
      });
    },
    [onFiltersChange]
  );

  const categoryOptions = useMemo(() => {
    const countByCat = {};
    lots.forEach((lot) => {
      const name = lot.category_name ?? lot.category?.name ?? '—';
      countByCat[name] = (countByCat[name] || 0) + 1;
    });
    return Object.entries(countByCat);
  }, [lots]);

  if (
    facetSectionsToShow.length === 0 &&
    categoryOptions.length === 0
  ) {
    return null;
  }

  return (
    <aside className="buyer-event-lots-filter">
      <div className="buyer-event-lots-filter__inner">
        {facetsData.make && Object.keys(facetsData.make).length > 0 && (
          <FilterSection
            title="Make"
            options={Object.entries(facetsData.make)}
            selected={selectedFilters.make || new Set()}
            onToggle={(v) => handleToggle('make', v)}
          />
        )}

        {categoryOptions.length > 0 && (
          <FilterSection
            title="Category"
            options={categoryOptions}
            selected={selectedFilters.category || new Set()}
            onToggle={(v) => handleToggle('category', v)}
          />
        )}

        {facetSectionsToShow
          .filter((s) => s.key !== 'make')
          .map((section) => (
            <FilterSection
              key={section.key}
              title={section.label}
              options={section.options}
              selected={selectedFilters[section.key] || new Set()}
              onToggle={(v) => handleToggle(section.key, v)}
            />
          ))}
      </div>
    </aside>
  );
};

export default BuyerEventLotsFilterBar;
