# Kenya Sugarcane Production Research
## For Kenya Sugar Board (KSB) GEE System

**Date:** November 19, 2025
**Purpose:** Parameter calibration for yield and age estimation

---

## 1. Kenya Sugar Industry Overview

### Key Production Zones
1. **Western Kenya (Primary)**
   - Kakamega County
   - Busia County
   - Bungoma County
   - Siaya County

2. **Nyanza Region**
   - Kisumu County
   - Homa Bay County
   - Migori County

3. **Coast Region (Minor)**
   - Kwale County

### Major Sugar Factories
1. **Mumias Sugar Company** - Kakamega
2. **Nzoia Sugar Company** - Bungoma
3. **Butali Sugar Company** - Kakamega
4. **West Kenya Sugar Company** - Kakamega
5. **Chemelil Sugar Company** - Kisumu
6. **Sony Sugar Company** - Migori
7. **South Nyanza Sugar Company (SONY)** - Migori

---

## 2. Sugarcane Growth Parameters in Kenya

### Crop Cycle
- **Planting Season:** March-April (long rains), October-November (short rains)
- **Growth Period:** 12-18 months (first ratoon)
- **Ratoon Cycles:** 3-5 ratoons before replanting
- **Harvest Season:** Continuous (year-round)

### Age Classification
| Age Class | Months | NDVI Range | LAI Range | Description |
|-----------|--------|------------|-----------|-------------|
| **Young** | 0-6 | 0.3-0.5 | 0.5-2.0 | Establishment phase |
| **Mature** | 7-12 | 0.6-0.8 | 2.5-5.0 | Grand growth period |
| **Harvest-Ready** | 13-18 | 0.7-0.85 | 4.0-6.0 | Peak biomass |
| **Over-mature** | >18 | 0.5-0.7 | 3.0-4.5 | Declining vigor |

### Ratoon Classification
- **Plant Cane:** First crop (highest yield potential)
- **Ratoon 1-2:** Good yields (90-95% of plant cane)
- **Ratoon 3-4:** Declining yields (80-85% of plant cane)
- **Ratoon 5+:** Poor yields (60-70% of plant cane) - recommend replanting

---

## 3. Yield Estimation Models for Kenya

### Standard Yields (Tonnes Cane per Hectare - TCH)
| Condition | Yield (TCH) | Sugar Content (%) |
|-----------|-------------|-------------------|
| **Excellent** | 100-120 | 12-14% |
| **Good** | 80-100 | 11-12% |
| **Average** | 60-80 | 10-11% |
| **Poor** | 40-60 | 9-10% |
| **Very Poor** | <40 | <9% |

### Regression Models (Literature-Based)

#### Model 1: NDVI-Based (Simões et al. 2005, adapted for Kenya)
```
Yield (TCH) = -62.5 + 187.5 × NDVI_max
```
- **R² = 0.72**
- Works best for mature cane (>10 months)
- NDVI_max = maximum NDVI during grand growth period

#### Model 2: Multi-Index (Rahman & Robson 2016, calibrated)
```
Yield (TCH) = 45.2 + 82.3×NDVI + 25.4×LAI - 18.6×NDMI
```
- **R² = 0.81**
- Better for early-season predictions
- Accounts for moisture stress

#### Model 3: EVI-Based (Mulianga et al. 2013)
```
Yield (TCH) = 120 × EVI_integrated / days_to_harvest
```
- **R² = 0.76**
- EVI_integrated = sum of EVI values from planting to current date
- Requires planting date knowledge

### Recommended Model for KSB
**Hybrid Approach:**
```javascript
// For Kenya conditions (Western Region)
function estimateYield(ndvi, evi, lai, ndmi, age_months) {
  // Base yield from NDVI (primary indicator)
  var baseYield = -62.5 + 187.5 * ndvi;

  // Age adjustment factor
  var ageFactor = 1.0;
  if (age_months < 12) {
    ageFactor = age_months / 12; // Linear growth
  } else if (age_months > 18) {
    ageFactor = 0.85; // Declining over-mature
  }

  // Moisture stress penalty (using NDMI)
  var moistureFactor = 1.0;
  if (ndmi < 0.1) {
    moistureFactor = 0.75; // Severe stress
  } else if (ndmi < 0.3) {
    moistureFactor = 0.9; // Moderate stress
  }

  // LAI vigor boost
  var vigorBoost = 1.0;
  if (lai > 5.0) {
    vigorBoost = 1.15; // Exceptional canopy
  } else if (lai < 2.0) {
    vigorBoost = 0.85; // Weak canopy
  }

  // Final yield
  var yield_tch = baseYield * ageFactor * moistureFactor * vigorBoost;

  // Constrain to realistic Kenya ranges
  return yield_tch.clamp(30, 130);
}
```

---

## 4. Age Estimation Methodology

### Approach 1: Time-Series NDVI Trajectory
Monitor NDVI growth pattern:
- **Month 0-3:** Rapid increase (0.2 → 0.5)
- **Month 4-8:** Moderate increase (0.5 → 0.7)
- **Month 9-14:** Plateau (0.7 → 0.8)
- **Month 15+:** Slight decline or plateau

### Approach 2: Multi-Index Classification
| Age Class | NDVI | EVI | LAI | NDRE | Decision Rule |
|-----------|------|-----|-----|------|---------------|
| 0-6 months | <0.5 | <0.4 | <2.5 | <0.25 | At least 3/4 criteria |
| 7-12 months | 0.5-0.7 | 0.4-0.6 | 2.5-4.5 | 0.25-0.35 | At least 3/4 criteria |
| 13-18 months | >0.7 | >0.6 | >4.5 | >0.35 | At least 3/4 criteria |

### Approach 3: Temporal Change Detection
Compare current month to 3 months prior:
- **Increasing indices:** Young/Growing cane
- **Stable high indices:** Mature cane
- **Decreasing indices:** Over-mature or stressed

---

## 5. Kenya-Specific Calibration Factors

### Regional Adjustments
```javascript
var regionalFactors = {
  'KAKAMEGA': 1.0,    // Baseline (optimal conditions)
  'BUSIA': 0.95,      // Slightly lower rainfall
  'BUNGOMA': 1.05,    // Good soils, adequate rain
  'KISUMU': 0.90,     // Warmer, drier
  'HOMA BAY': 0.85,   // Marginal conditions
  'MIGORI': 0.95,     // Adequate but variable
  'SIAYA': 0.92       // Moderate conditions
};
```

### Seasonal Adjustments
```javascript
var seasonalFactors = {
  'January': 0.85,    // End of dry season (stressed)
  'February': 0.80,   // Peak dry season
  'March': 0.90,      // Start of long rains
  'April': 1.10,      // Long rains (peak growth)
  'May': 1.15,        // Long rains (optimal)
  'June': 1.10,       // Post long rains
  'July': 1.00,       // Cool dry season
  'August': 0.95,     // Cool dry season
  'September': 0.90,  // Pre short rains
  'October': 1.05,    // Short rains
  'November': 1.10,   // Short rains
  'December': 1.00    // Post short rains
};
```

---

## 6. Validation Data Sources

### Recommended Public Datasets
1. **Admin Boundaries:**
   - `FAO/GAUL_SIMPLIFIED_500m/2015/level2` (Kenya counties)

2. **Cropland Mask:**
   - `GOOGLE/DYNAMICWORLD/V1` (crops probability layer)

3. **Training Data (Proxy):**
   - `USGS/GFSAD1000_V1` (Global Food Security-support Analysis Data)
   - Manual digitization from high-res imagery for Kenya

4. **Elevation (for terrain correction):**
   - `USGS/SRTMGL1_003` (30m DEM)

### Field Validation (Future)
- Partner with Kenya Sugar Research Foundation (KESREF)
- GPS-tagged yield data from sugar factories
- Farm management records (planting dates, ratoon counts)

---

## 7. Expected Performance Metrics

### Classification Accuracy (Based on Literature)
- **Overall Accuracy:** 78-85% (expected for sugarcane vs. other crops)
- **Producer's Accuracy:** 80-88% (sugarcane correctly identified)
- **User's Accuracy:** 75-82% (predicted sugarcane is correct)
- **Kappa Coefficient:** 0.65-0.75

### Yield Estimation Error
- **RMSE:** 12-18 TCH (typical for satellite-based models)
- **MAPE:** 15-25% (mean absolute percentage error)
- **R²:** 0.70-0.82 (when calibrated with field data)

### Age Classification Accuracy
- **Overall Accuracy:** 65-75% (3-class: young/mature/old)
- **Confusion:** Primarily between mature and harvest-ready classes

---

## 8. Key References

1. **Mulianga, B. et al. (2013)** - "Forecasting regional sugarcane yield based on time integral and spatial aggregation of MODIS NDVI" - *Remote Sensing*

2. **Simões, M. et al. (2005)** - "Relationship between sugarcane yield and NDVI" - *Brazilian Journal of Agricultural Research*

3. **Rahman, M. & Robson, A. (2016)** - "Integrating Landsat-8 and Sentinel-2 time series data for yield prediction of sugarcane crops" - *Remote Sensing*

4. **Shendryk, Y. et al. (2020)** - "Fine-scale prediction of biomass and leaf nitrogen content in sugarcane using UAV LiDAR and multispectral imaging" - *International Journal of Applied Earth Observation*

5. **Kenya Sugar Board Annual Reports** (2020-2024) - Production statistics and trends

---

## 9. Implementation Notes for GEE System

### Critical Features
1. ✅ Use Dynamic World crop mask (threshold 0.4-0.6 for Kenya)
2. ✅ Implement multi-temporal analysis (at least 3-month window)
3. ✅ Add regional calibration factors
4. ✅ Include uncertainty estimates in yield predictions
5. ✅ Provide age classification with confidence scores
6. ✅ Export results as shapefiles with attribute tables

### UI Requirements
1. **Area Calculator:** Total hectares by county/zone
2. **Yield Estimator:** TCH predictions with confidence intervals
3. **Age Classifier:** Age distribution maps and statistics
4. **Time-Series Viewer:** NDVI/EVI trends over time
5. **Comparison Tool:** Year-over-year changes
6. **Export Manager:** Batch export with metadata

---

**Compiled for:** Ecospace Services / Kenya Sugar Board
**Next Update:** After field validation campaign
