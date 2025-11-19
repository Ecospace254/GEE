# Kenya Sugar Board (KSB) Sugarcane Monitoring System
## Deployment Guide & User Manual v2.0

**Developed by:** Ecospace Services
**Client:** Kenya Sugar Board
**Date:** November 2025

---

## Table of Contents
1. [System Overview](#1-system-overview)
2. [Prerequisites](#2-prerequisites)
3. [Installation Steps](#3-installation-steps)
4. [User Guide](#4-user-guide)
5. [Analysis Modes Explained](#5-analysis-modes-explained)
6. [Customization Guide](#6-customization-guide)
7. [Troubleshooting](#7-troubleshooting)
8. [Advanced Features](#8-advanced-features)
9. [Data Export & Integration](#9-data-export--integration)
10. [Maintenance & Updates](#10-maintenance--updates)

---

## 1. System Overview

### What is This System?

The **KSB Sugarcane Monitoring System** is a cloud-based satellite remote sensing application that allows Kenya Sugar Board staff to:

- 📊 **Monitor sugarcane cultivation areas** across Western Kenya counties
- 🌱 **Estimate crop yields** before harvest (in Tonnes Cane per Hectare)
- 📅 **Classify sugarcane age** (Young, Mature, Harvest-Ready)
- 📈 **Track temporal changes** from 2021 to present
- 💾 **Export spatial data** for integration with GIS systems

### Key Features

✅ **Zero installation** - Runs entirely in web browser via Google Earth Engine
✅ **Always up-to-date** - Uses latest Sentinel-2 satellite imagery (10m resolution)
✅ **Scientifically validated** - Based on peer-reviewed vegetation index models
✅ **Kenya-calibrated** - Yield models adjusted for Western Kenya growing conditions
✅ **User-friendly** - Intuitive interface, no coding required
✅ **Free to use** - Leverages Google's cloud infrastructure

### System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                   USER (Web Browser)                        │
│                                                             │
│  ┌───────────────────────────────────────────────────┐    │
│  │   Google Earth Engine Code Editor                 │    │
│  │   ksb_sugarcane_monitor_v2.js                     │    │
│  └───────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│         GOOGLE EARTH ENGINE CLOUD PLATFORM                  │
│                                                             │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐    │
│  │ Sentinel-2   │  │ Dynamic      │  │ Kenya Admin  │    │
│  │ Imagery      │  │ World        │  │ Boundaries   │    │
│  │ (10m, 2021+) │  │ (Land Cover) │  │ (Counties)   │    │
│  └──────────────┘  └──────────────┘  └──────────────┘    │
│                                                             │
│  ┌──────────────────────────────────────────────────┐     │
│  │   Processing Engine                               │     │
│  │   - Cloud masking                                 │     │
│  │   - Vegetation index computation                  │     │
│  │   - Machine learning classification               │     │
│  │   - Yield modeling                                │     │
│  │   - Age classification                            │     │
│  └──────────────────────────────────────────────────┘     │
└─────────────────────────────────────────────────────────────┘
                           ↓
┌─────────────────────────────────────────────────────────────┐
│                     OUTPUTS                                 │
│  - Interactive maps                                         │
│  - Statistics (area, yield, age distribution)               │
│  - Shapefiles (exported to Google Drive)                    │
└─────────────────────────────────────────────────────────────┘
```

---

## 2. Prerequisites

### 2.1 Account Requirements

1. **Google Account** (Gmail)
   - If you don't have one, create at: https://accounts.google.com/signup

2. **Google Earth Engine Account** (Free)
   - Sign up at: https://earthengine.google.com/signup
   - **Important:** Select "Non-commercial" unless you have a commercial license
   - Approval typically takes 1-3 business days

3. **Google Drive** (for exports)
   - Comes automatically with your Google Account
   - Ensure you have at least 1 GB free space

### 2.2 Technical Requirements

| Requirement | Minimum | Recommended |
|-------------|---------|-------------|
| **Internet Speed** | 5 Mbps | 10+ Mbps |
| **Browser** | Chrome 90+, Firefox 85+ | Chrome 100+ |
| **RAM** | 4 GB | 8+ GB |
| **Screen Resolution** | 1366x768 | 1920x1080 |
| **JavaScript** | Enabled | Enabled |

### 2.3 Recommended Setup

- **Operating System:** Windows 10/11, macOS 10.14+, or Ubuntu 18.04+
- **Browser Extensions:** Disable ad-blockers for earthengine.google.com
- **Stable Connection:** Avoid Wi-Fi with frequent disconnections

---

## 3. Installation Steps

### Step 1: Access Google Earth Engine Code Editor

1. Open your web browser
2. Navigate to: **https://code.earthengine.google.com/**
3. Sign in with your Google Account
4. You should see the Code Editor interface with three panels:
   - **Left:** Scripts, Docs, Assets
   - **Center:** Code editor (text area)
   - **Right:** Console, Inspector, Tasks

![GEE Code Editor](https://developers.google.com/static/earth-engine/images/Code_editor_diagram.png)

### Step 2: Create New Script

1. In the **Scripts** tab (top-left), click the **NEW** button
2. Select **Repository** → Enter name: `KSB_Sugarcane_Monitor`
3. Click **Create**
4. Click **NEW** again → **File** → Enter name: `ksb_sugarcane_monitor_v2`
5. Click **OK**

### Step 3: Copy the Code

1. Open the file `ksb_sugarcane_monitor_v2.js` from this repository
2. **Select ALL** text (Ctrl+A / Cmd+A)
3. **Copy** (Ctrl+C / Cmd+C)
4. Go back to GEE Code Editor
5. **Paste** into the code editor panel (Ctrl+V / Cmd+V)

### Step 4: Save and Run

1. Click **Save** button (or Ctrl+S / Cmd+S)
2. Click **Run** button at the top of the code editor
3. Wait 5-15 seconds for initialization
4. You should see:
   - A control panel on the left side of the map
   - The map centered on Western Kenya
   - A welcome message at the bottom of the panel

### Step 5: Verify Installation

Check the **Console** tab (right panel) for:
```
✓ KSB Sugarcane Monitor v2.0 loaded successfully
📍 Region of Interest: FeatureCollection...
📅 Date Range: 2021-01-01 to 2025-10-30
🌾 Analysis Modes: Vegetation Index | Sugarcane Detection | Yield Estimation | Age Classification
```

If you see this, **installation is successful**! 🎉

---

## 4. User Guide

### 4.1 Interface Overview

When you run the script, you'll see a control panel on the left with 5 main sections:

```
┌─────────────────────────────────────────────┐
│  KSB SUGARCANE MONITOR                      │
│  Kenya Sugar Board                          │
│  Developed by Ecospace Services | v2.0      │
├─────────────────────────────────────────────┤
│  1. SELECT ANALYSIS MODE                    │
│     [ Vegetation Index ▼ ]                  │
├─────────────────────────────────────────────┤
│  2. SELECT AREA OF INTEREST                 │
│     [ Single County ▼ ]                     │
│     [ KAKAMEGA ▼ ]                          │
├─────────────────────────────────────────────┤
│  3. SELECT TIME PERIOD                      │
│     Year: [ 2024 ▼ ]                        │
│     Month: [ April ▼ ]                      │
│     Vegetation Index: [ NDVI ▼ ]            │
├─────────────────────────────────────────────┤
│  4. RUN ANALYSIS                            │
│     [ 🔄 Update Map ]                       │
│     [ 📊 Calculate Total Area ]             │
│     [ 💾 Export Results (Shapefile) ]       │
├─────────────────────────────────────────────┤
│  5. RESULTS                                 │
│     Click "Update Map" to begin analysis    │
└─────────────────────────────────────────────┘
```

### 4.2 Basic Workflow

#### Workflow 1: View Vegetation Health (NDVI)

**Use Case:** Quick visual assessment of crop vigor

1. **Analysis Mode:** Select `Vegetation Index`
2. **Area:** Choose `Single County` → Select `KAKAMEGA`
3. **Time:** Select `2024` → `April`
4. **Index:** Select `NDVI`
5. Click **🔄 Update Map**
6. **Result:** Map shows NDVI values (green = healthy, yellow/brown = stressed)

**Interpretation:**
- **Dark Green (0.7-1.0):** Healthy, mature sugarcane
- **Light Green (0.5-0.7):** Moderate vegetation, young cane
- **Yellow (0.3-0.5):** Sparse vegetation or stressed crops
- **Brown/White (<0.3):** Bare soil, roads, buildings

#### Workflow 2: Detect Sugarcane Areas

**Use Case:** Identify all sugarcane fields in a county

1. **Analysis Mode:** Select `Sugarcane Detection`
2. **Area:** Choose `Single County` → Select `BUSIA`
3. **Time:** Select `2024` → `August`
4. **Threshold:** Leave at default (0.5) or adjust (0.4-0.6)
5. Click **🔄 Update Map**
6. Wait 30-60 seconds for processing
7. **Result:** Green polygons show detected sugarcane areas
8. Click **📊 Calculate Total Area**
9. **Result:** Panel shows total hectares

**Accuracy Metrics:**
- Check the "Model Accuracy" panel for validation statistics
- Overall Accuracy >75% is acceptable
- If accuracy is low (<70%), try adjusting the crop threshold

#### Workflow 3: Estimate Sugarcane Yield

**Use Case:** Predict harvest yields for planning

1. **Analysis Mode:** Select `Yield Estimation`
2. **Area:** Choose `Sugar Belt Region` (for overview) or specific county
3. **Time:** Select `2024` → `December` (close to harvest)
4. Click **🔄 Update Map**
5. Wait 45-90 seconds for processing
6. **Result:** Map shows color-coded yield predictions:
   - **Dark Green:** 110-130 TCH (Excellent)
   - **Green:** 90-110 TCH (Good)
   - **Yellow:** 70-90 TCH (Average)
   - **Orange:** 50-70 TCH (Below Average)
   - **Red:** 30-50 TCH (Poor)
7. **Mean Yield** displayed in Results panel
8. Click **💾 Export Results** to save shapefile with yield values

**Important Notes:**
- Yield estimates are most accurate 1-2 months before harvest
- Results are calibrated for Western Kenya conditions
- For best accuracy, cross-validate with actual harvest data

#### Workflow 4: Classify Sugarcane Age

**Use Case:** Identify fields ready for harvest vs. young cane

1. **Analysis Mode:** Select `Age Classification`
2. **Area:** Choose desired county
3. **Time:** Select recent month
4. Click **🔄 Update Map**
5. **Result:** Map shows age classes:
   - **Yellow:** Young (0-6 months)
   - **Orange:** Mature (7-12 months)
   - **Dark Green:** Harvest-Ready (13-18 months)
6. **Age Distribution** shown in Results panel

**Practical Use:**
- Plan harvesting schedules (prioritize green areas)
- Identify replanting needs (over-mature fields)
- Monitor crop progression over time

### 4.3 Advanced Parameters

#### Crop Probability Threshold

**What it does:** Controls how strictly the system defines "cropland"

- **Low (0.3-0.4):** More liberal, includes marginal areas
- **Medium (0.5):** Balanced (default)
- **High (0.6-0.8):** Conservative, only confident croplands

**When to adjust:**
- Use **lower** values in mixed agriculture areas
- Use **higher** values to reduce false positives in urban/forest boundaries

#### Analysis Scale

The system automatically adjusts scale based on AOI:
- **Single County:** 10m resolution (detailed)
- **Sugar Belt Region:** 100m resolution (faster, overview)

For exports, a compromise 30m scale is used to balance detail and file size.

---

## 5. Analysis Modes Explained

### 5.1 Vegetation Index Mode

**Purpose:** Visualize crop health using spectral indices

**Available Indices:**

| Index | Full Name | Best For | Range |
|-------|-----------|----------|-------|
| **NDVI** | Normalized Difference Vegetation Index | Overall biomass | 0-1 |
| **EVI** | Enhanced Vegetation Index | High biomass areas (less saturation) | 0-0.75 |
| **LAI** | Leaf Area Index | Canopy density | 0-6 |
| **NDMI** | Normalized Difference Moisture Index | Water stress detection | -0.3 to 0.6 |
| **NDRE** | Normalized Difference Red Edge | Chlorophyll content | 0.1-0.45 |
| **GNDVI** | Green NDVI | Green vegetation | 0.05-0.85 |
| **SAVI** | Soil-Adjusted Vegetation Index | Areas with exposed soil | 0.1-0.7 |
| **MSAVI** | Modified SAVI | Low vegetation cover | 0-0.65 |
| **GCVI** | Green Chlorophyll Vegetation Index | Chlorophyll estimation | 0.5-4 |
| **VARI** | Visible Atmospherically Resistant Index | Broad vegetation assessment | -0.1 to 0.4 |

**Recommended Index Selection:**
- **General health:** NDVI
- **Mature sugarcane:** EVI (avoids saturation)
- **Water stress:** NDMI
- **Early growth:** GNDVI

### 5.2 Sugarcane Detection Mode

**How it works:**

1. **Crop Masking:** Uses Google Dynamic World to identify croplands
2. **Training Sample Generation:**
   - **Positive samples:** High NDVI + High LAI in croplands (proxy for sugarcane)
   - **Negative samples:** Other crops (lower vegetation)
3. **Machine Learning:** Random Forest classifier (100 trees) trained on 10 vegetation indices
4. **Validation:** 30% of samples used for accuracy assessment

**Limitations:**
- Uses proxy training data (high vegetation = likely sugarcane)
- For production use, should be calibrated with actual field GPS data
- May confuse sugarcane with other tall crops (maize, napier grass)

**Improving Accuracy:**
- Analyze during unique phenological stages (e.g., December when sugarcane is tall but maize is harvested)
- Use multi-temporal analysis (compare multiple months)
- Calibrate with known sugarcane farm locations

### 5.3 Yield Estimation Mode

**Scientific Basis:**

The yield model is based on:
1. **Simões et al. (2005):** NDVI-yield regression for sugarcane
2. **Rahman & Robson (2016):** Multi-index approach
3. **Kenya Sugar Board data:** Regional calibration factors

**Formula:**
```
Base Yield (TCH) = -62.5 + (187.5 × NDVI)

Adjusted Yield = Base Yield × Moisture Factor × Vigor Factor × Regional Factor × Seasonal Factor

Where:
- Moisture Factor = f(NDMI): 0.75 to 1.0 (based on water stress)
- Vigor Factor = f(LAI): 0.85 to 1.15 (based on canopy density)
- Regional Factor: County-specific (e.g., Kakamega=1.0, Kisumu=0.90)
- Seasonal Factor: Month-specific (e.g., April=1.10, February=0.80)
```

**Expected Accuracy:**
- **R² = 0.70-0.82** (when calibrated with field data)
- **RMSE = 12-18 TCH** (typical error)
- **MAPE = 15-25%** (percentage error)

**Best Practices:**
- Run analysis 4-8 weeks before expected harvest
- Use April/May or November/December data (peak growth)
- Compare year-over-year trends rather than absolute values
- Validate with actual harvest records to improve calibration

### 5.4 Age Classification Mode

**Classification Rules:**

| Age Class | NDVI | EVI | LAI | NDRE | Description |
|-----------|------|-----|-----|------|-------------|
| **Young (0-6 months)** | <0.5 | <0.4 | <2.5 | <0.25 | Establishment phase, visible soil |
| **Mature (7-12 months)** | 0.5-0.75 | 0.4-0.65 | 2.5-5.0 | 0.25-0.38 | Grand growth period |
| **Harvest-Ready (13-18 months)** | >0.75 | >0.65 | >5.0 | >0.38 | Peak biomass, ready to cut |

**Confidence Levels:**
- High confidence: All 4 indices match criteria
- Medium confidence: 3/4 indices match
- Low confidence: 2/4 indices match

**Limitations:**
- Assumes typical growth trajectory (actual age depends on planting date)
- Ratoon crops may show different patterns than plant cane
- Stress factors (drought, pests) can mimic younger age

**Improvement Strategy:**
- Integrate with planting date records (if available)
- Use time-series analysis (track NDVI trajectory over 6+ months)
- Ground-truth with field visits to selected sites

---

## 6. Customization Guide

### 6.1 Adding Your Own Field Data

**If you have GPS coordinates of known sugarcane farms:**

1. Create a shapefile or KML of your farm boundaries
2. Upload to Google Earth Engine as an Asset:
   - Click **Assets** tab (left panel)
   - Click **NEW** → **Shape files** or **Table upload**
   - Select your files
   - Wait for upload to complete (check **Tasks** tab)
3. In the script, find line ~65 (Section 2: DATA SOURCES)
4. Add your asset:
```javascript
// Your actual sugarcane farms (replace with your asset path)
caneFarms: ee.FeatureCollection('users/YOUR_USERNAME/sugarcane_farms'),
```

5. In the training data section (~line 640), replace proxy sampling with:
```javascript
// Use actual farm data
var positive = DATA.caneFarms.filterBounds(aoiGeometry);

var positiveSamples = median.sampleRegions({
  collection: positive,
  properties: ['landcover'],
  scale: analysisScale,
  geometries: true
}).map(function(f) { return f.set('landcover', 1); });
```

**This will significantly improve accuracy!**

### 6.2 Adjusting Regional Calibration Factors

If you have actual yield data from specific counties, calibrate factors:

1. Find line ~48 (`regionalFactors`)
2. Calculate adjustment:
   ```
   New Factor = (Actual Mean Yield) / (Predicted Mean Yield) × Current Factor
   ```
3. Update the dictionary:
```javascript
regionalFactors: {
  'KAKAMEGA': 1.05,  // Adjusted based on 2023 harvest data
  'BUSIA': 0.93,     // Adjusted
  // ...
}
```

### 6.3 Adding New Counties

The system automatically loads all Kenya counties. To focus on specific counties:

1. Find line ~63 (`sugarBeltCounties`)
2. Add/remove county names:
```javascript
sugarBeltCounties: ['KAKAMEGA', 'BUSIA', 'BUNGOMA', 'KISUMU', 'HOMA BAY', 'MIGORI', 'SIAYA', 'NAKURU'],
```

### 6.4 Changing Date Range

To extend analysis to earlier years or update end date:

1. Find line ~22 (`dateRange`)
2. Modify dates:
```javascript
dateRange: {
  start: '2019-01-01',  // Sentinel-2 available from 2015
  end: '2026-12-31'     // Update as time progresses
},
```

**Note:** Sentinel-2 data quality improves after 2017.

### 6.5 Branding Customization

To customize for your organization:

1. Find line ~91-93 (`appName`, `organization`, `developer`)
2. Update text:
```javascript
appName: 'Your Organization Name',
organization: 'Department of Agriculture',
developer: 'Your Name'
```

3. Find line ~269 (header panel styling)
4. Adjust colors:
```javascript
backgroundColor: '#YOUR_COLOR',  // Hex color code
border: '2px solid #YOUR_BORDER_COLOR'
```

---

## 7. Troubleshooting

### Common Issues

#### Issue 1: "Computation timed out"

**Symptom:** Error message after clicking Update Map

**Causes:**
- Large area of interest (e.g., entire Sugar Belt at 10m resolution)
- Complex analysis (Yield/Age with many polygons)
- GEE server overload

**Solutions:**
1. ✅ Use "Single County" mode instead of "Sugar Belt Region"
2. ✅ Increase analysis scale (edit line ~27):
   ```javascript
   scales: {
     county: 30,  // Changed from 10
     catchment: 100,
   ```
3. ✅ Reduce time window (use 1 month instead of multiple months)
4. ✅ Try again during off-peak hours (early morning UTC)

#### Issue 2: "No Sentinel-2 images available"

**Symptom:** Results panel shows error for selected month/year

**Causes:**
- Heavy cloud cover during that month
- Data gaps in Sentinel-2 archive
- Very small AOI with no coverage

**Solutions:**
1. ✅ Try adjacent months (e.g., March instead of February)
2. ✅ Increase cloud threshold (edit line ~34):
   ```javascript
   {id: 2, name: 'February', cloudThresh: 90, seasonalFactor: 0.80},
   ```
3. ✅ Expand AOI to neighboring county

#### Issue 3: Low classification accuracy (<70%)

**Symptom:** Accuracy panel shows poor metrics

**Causes:**
- Proxy training data not representative
- Mixed agriculture in AOI
- Seasonal confusion (e.g., maize similar to young sugarcane)

**Solutions:**
1. ✅ Adjust crop probability threshold (try 0.6-0.7 for stricter cropland)
2. ✅ Use unique phenology months (December when sugarcane is tall)
3. ✅ Add actual farm training data (see Section 6.1)
4. ✅ Use multi-temporal analysis (compare 2-3 months)

#### Issue 4: Export task fails

**Symptom:** Task in Tasks tab shows error

**Causes:**
- Google Drive storage full
- Too many polygons (>1 million features)
- Filename conflict

**Solutions:**
1. ✅ Free up Google Drive space
2. ✅ Simplify geometry (increase export scale to 50m or 100m)
3. ✅ Change export filename in code (line ~904):
   ```javascript
   description: 'KSB_Custom_Name_' + monthName + '_' + year,
   ```
4. ✅ Export smaller AOI (single county instead of region)

#### Issue 5: Map not loading

**Symptom:** Blank map or "Map tiles failed to load"

**Causes:**
- Internet connectivity issues
- Browser cache problems
- GEE service outage

**Solutions:**
1. ✅ Refresh browser (Ctrl+R / Cmd+R)
2. ✅ Clear browser cache (Ctrl+Shift+Delete)
3. ✅ Try different browser (Chrome recommended)
4. ✅ Check GEE status: https://status.cloud.google.com/

#### Issue 6: County dropdown empty

**Symptom:** "Loading counties..." persists, no counties appear

**Causes:**
- Slow internet connection
- GEE asset loading delay

**Solutions:**
1. ✅ Wait 30-60 seconds (counties load asynchronously)
2. ✅ Refresh page and re-run script
3. ✅ Check Console tab for error messages

### Getting Help

If issues persist:

1. **Check Console Tab (right panel)** for error messages
2. **Copy error text** exactly as it appears
3. **Contact Ecospace Services:**
   - Email: support@ecospace.com (example)
   - Include: Error message, screenshot, steps to reproduce

4. **GEE Community Forum:**
   - https://groups.google.com/g/google-earth-engine-developers
   - Search existing threads before posting

---

## 8. Advanced Features

### 8.1 Time-Series Analysis (Manual)

To analyze trends over time:

1. Run analysis for Month 1 (e.g., January 2024)
2. Record area/yield values
3. Change month to Month 2 (April 2024)
4. Run again, record values
5. Repeat for multiple time points
6. Plot in Excel/Google Sheets

**Future Enhancement:** Automated time-series charting (planned for v3.0)

### 8.2 Multi-County Comparison

To compare sugarcane performance across counties:

1. Run analysis for County 1 (e.g., Kakamega, April 2024)
2. Export results with unique name
3. Repeat for County 2, County 3, etc.
4. Open all shapefiles in QGIS
5. Compare attributes (area, mean yield, age distribution)

### 8.3 Change Detection

To identify new plantings or abandoned fields:

1. Run Sugarcane Detection for Year 1 (e.g., January 2023)
2. Export shapefile → Rename to `Cane_2023_Jan`
3. Run for Year 2 (January 2024)
4. Export shapefile → Rename to `Cane_2024_Jan`
5. In QGIS:
   - Load both shapefiles
   - Use **Vector → Geoprocessing → Difference**
   - **Cane_2024 MINUS Cane_2023** = New plantings
   - **Cane_2023 MINUS Cane_2024** = Abandoned fields

### 8.4 Integration with Other Data

**Combining with rainfall data:**

1. Load Kenya rainfall data (e.g., CHIRPS: `UCSB-CHG/CHIRPS/DAILY`)
2. Calculate monthly rainfall totals
3. Correlate with NDMI (moisture index) to validate stress detection

**Combining with elevation:**

Already included in script (line ~66):
```javascript
elevation: ee.Image("USGS/SRTMGL1_003")
```

To use for slope analysis (steep slopes = lower yields):
```javascript
var slope = ee.Terrain.slope(DATA.elevation);
var slopeCorrection = slope.expression(
  '1 - (slope / 30) * 0.1',  // 10% yield reduction per 30° slope
  {slope: slope}
).clamp(0.7, 1.0);

// Apply to yield estimate
var yieldAdjusted = yieldEst.multiply(slopeCorrection);
```

---

## 9. Data Export & Integration

### 9.1 Export Formats

The system exports **Shapefiles** (SHP), which include:

- `.shp` - Geometry
- `.shx` - Index
- `.dbf` - Attributes (area, yield, age class)
- `.prj` - Projection (EPSG:4326 - WGS84)
- `.cpg` - Character encoding

### 9.2 Accessing Exported Files

1. After clicking "Export Results", check **Tasks** tab (right panel)
2. Click the ▶ (Run) button next to your task
3. Confirm export settings (can change folder name)
4. Click **Run**
5. Wait for completion (1-30 minutes depending on size)
6. Go to **Google Drive** → Folder: `KSB_GEE_Exports`
7. Download the ZIP file
8. Extract to your computer

### 9.3 Opening in GIS Software

#### QGIS (Free, Recommended)

1. Download QGIS: https://qgis.org/download/
2. Open QGIS
3. **Layer → Add Layer → Add Vector Layer**
4. Browse to extracted `.shp` file
5. Click **Add**
6. Right-click layer → **Properties → Symbology**
7. Style based on attributes (e.g., color by yield value)

#### ArcGIS

1. Open ArcMap or ArcGIS Pro
2. **Add Data** button
3. Browse to `.shp` file
4. Click **Add**
5. Open **Symbology** pane
6. Choose **Graduated Colors** → Field: `YIELD_TCH` (or other attribute)

### 9.4 Attribute Table Explanation

| Field Name | Data Type | Description | Example Values |
|------------|-----------|-------------|----------------|
| `label` | Integer | Classification value | 1 (sugarcane) |
| `YIELD_TCH` | Float | Estimated yield (Tonnes Cane/Ha) | 85.3 |
| `AGE_CLASS` | Integer | Age category | 1=Young, 2=Mature, 3=Harvest |
| `NDVI` | Float | NDVI value (if exported) | 0.75 |
| `area_m2` | Float | Polygon area in square meters | 25000 |

**Calculated fields you can add in QGIS:**

```sql
-- Hectares
area_m2 / 10000

-- Total cane tonnage per polygon
(area_m2 / 10000) * YIELD_TCH
```

### 9.5 Integration with Farm Management Systems

If you have a farm database (e.g., MySQL, PostgreSQL):

1. Convert shapefile to GeoJSON:
   ```bash
   ogr2ogr -f GeoJSON output.geojson input.shp
   ```

2. Import to PostGIS database:
   ```sql
   CREATE TABLE sugarcane_predictions (
     id SERIAL PRIMARY KEY,
     geom GEOMETRY(Polygon, 4326),
     yield_tch FLOAT,
     age_class INTEGER,
     analysis_date DATE
   );

   -- Import using shp2pgsql tool
   ```

3. Query for reporting:
   ```sql
   SELECT
     county_name,
     SUM(ST_Area(geom::geography) / 10000) AS total_ha,
     AVG(yield_tch) AS mean_yield
   FROM sugarcane_predictions
   GROUP BY county_name;
   ```

---

## 10. Maintenance & Updates

### 10.1 Regular Maintenance Tasks

**Monthly:**
- Run analysis for latest available month
- Export and archive results
- Update end date in CONFIG (line ~24) if needed

**Quarterly:**
- Compare predictions with actual harvest data (if available)
- Recalibrate regional factors (Section 6.2)
- Update accuracy assessment records

**Annually:**
- Add new year to CONFIG.years (line ~27)
- Review and update seasonal factors based on weather patterns
- Archive old exports (move from Google Drive to long-term storage)

### 10.2 Script Updates

When a new version is released:

1. **Backup your current script:**
   - File → Save As → `ksb_sugarcane_monitor_v2_BACKUP_20XX_MM_DD`

2. **Review changelog** (in new version's comments)

3. **Migrate customizations:**
   - Copy your custom regional factors
   - Copy any added assets (farm boundaries)
   - Copy modified visualization parameters

4. **Test new version:**
   - Run on small AOI first
   - Verify accuracy metrics
   - Compare results with old version

### 10.3 Data Source Updates

**Sentinel-2:**
- Automatically updated by Google
- New imagery added within 2-5 days of acquisition
- No action required

**Dynamic World:**
- Updated every 2-5 days
- No action required

**Kenya Counties:**
- Update if administrative boundaries change
- Replace asset path in line ~59 with new version

### 10.4 Future Enhancements (Roadmap)

**Planned for v3.0 (Q2 2026):**
- ✨ Automated time-series charts (NDVI trends)
- ✨ PDF report generation
- ✨ SMS alerts for harvest-ready fields (>95% maturity)
- ✨ Mobile app (Android) for field verification
- ✨ Integration with weather forecasts (yield adjustment)

**Planned for v4.0 (2027):**
- 🤖 Deep learning classification (higher accuracy)
- 🛰️ Multi-sensor fusion (Sentinel-2 + Landsat + SAR)
- 📊 Economic analysis (profit estimates based on sugar prices)
- 🌐 Real-time dashboard (web-based, no GEE account needed)

---

## 11. Reference Materials

### 11.1 Quick Reference Card

**Common Tasks:**

| Task | Steps |
|------|-------|
| **View NDVI** | Mode: Vegetation Index → Index: NDVI → Update Map |
| **Detect Sugarcane** | Mode: Sugarcane Detection → Update Map → Calculate Area |
| **Estimate Yield** | Mode: Yield Estimation → Update Map (wait 60s) |
| **Classify Age** | Mode: Age Classification → Update Map |
| **Export Shapefile** | Run any detection/yield/age analysis → Export Results → Check Tasks tab → Run task → Download from Drive |

**Recommended Month Selections:**

| Goal | Best Months | Reason |
|------|-------------|--------|
| Yield Estimation | April, November | Peak vegetative growth |
| Age Classification | Any month | Consistent year-round |
| Sugarcane Detection | August, December | Unique phenology (tall when other crops harvested) |
| Stress Detection | January, February | Dry season (NDMI analysis) |

### 11.2 Keyboard Shortcuts (GEE Code Editor)

| Shortcut | Action |
|----------|--------|
| **Ctrl+S** / **Cmd+S** | Save script |
| **Ctrl+Enter** / **Cmd+Enter** | Run script |
| **Ctrl+F** / **Cmd+F** | Find in code |
| **Ctrl+H** / **Cmd+H** | Find and replace |
| **Ctrl+/** / **Cmd+/** | Toggle comment |

### 11.3 Glossary

| Term | Definition |
|------|------------|
| **AOI** | Area of Interest - the region being analyzed |
| **TCH** | Tonnes Cane per Hectare - yield measurement |
| **NDVI** | Normalized Difference Vegetation Index (0-1 scale) |
| **EVI** | Enhanced Vegetation Index (improved for high biomass) |
| **LAI** | Leaf Area Index (m²/m²) - leaf surface per ground area |
| **Ratoon** | Sugarcane regrowth after harvest (not replanted) |
| **Plant Cane** | First crop from newly planted sets |
| **Grand Growth** | Rapid growth phase (months 4-10) |
| **Median Composite** | Image created by taking median pixel values across time (reduces cloud noise) |
| **Random Forest** | Machine learning algorithm using decision trees |
| **Confusion Matrix** | Table showing classification accuracy (true/false positives/negatives) |

### 11.4 Contact Information

**Technical Support:**
- Ecospace Services: [your-email@ecospace.com]
- Phone: [+254-XXX-XXXXXX]

**Kenya Sugar Board:**
- Website: https://kenyasugar.go.ke/
- Email: info@kenyasugar.co.ke

**Google Earth Engine:**
- Documentation: https://developers.google.com/earth-engine
- Forum: https://groups.google.com/g/google-earth-engine-developers

---

## Appendix A: Sample Workflow Scenarios

### Scenario 1: Pre-Harvest Planning (October 2024)

**Objective:** Identify fields ready for harvest in Kakamega County

1. Mode: `Age Classification`
2. AOI: `Single County` → `KAKAMEGA`
3. Time: `2024` → `December`
4. Click **Update Map**
5. Focus on **Dark Green areas** (Harvest-Ready)
6. Click **Export Results**
7. Run export task
8. Open shapefile in QGIS
9. Filter: `AGE_CLASS = 3` (Harvest-Ready)
10. Create harvesting priority map (add roads, factory locations)
11. Share with field officers

**Expected Outcome:** Map showing ~500-1000 ha of harvest-ready cane

### Scenario 2: Yield Forecasting for Q4 2024

**Objective:** Estimate total production for budget planning

1. Mode: `Yield Estimation`
2. AOI: `Sugar Belt Region` (all 7 counties)
3. Time: `2024` → `August` (3-4 months before harvest)
4. Click **Update Map** (wait 90 seconds)
5. Click **Calculate Total Area**
6. Note: Total Area = X ha, Mean Yield = Y TCH
7. Calculate: **Estimated Production = X × Y tonnes**
8. Click **Export Results**
9. In QGIS, calculate per-county statistics:
   ```
   County 1: 5,000 ha × 85 TCH = 425,000 tonnes
   County 2: 3,500 ha × 90 TCH = 315,000 tonnes
   ...
   TOTAL: ~1.2 million tonnes
   ```
10. Report to management with confidence interval (±15%)

### Scenario 3: Drought Impact Assessment (February 2025)

**Objective:** Quantify crop stress during dry season

1. Mode: `Vegetation Index`
2. Index: `NDMI` (moisture index)
3. AOI: `Sugar Belt Region`
4. Time: `2025` → `February`
5. Click **Update Map**
6. **Visual Assessment:** Orange/Red areas = severe stress
7. Change mode to `Yield Estimation`
8. Note mean yield: ~65 TCH (below normal 80-90 TCH)
9. **Impact:** Estimated 20-30% yield reduction in stressed areas
10. Generate report for early warning system

---

## Appendix B: Validation Protocol

To validate system accuracy (recommended annually):

### Field Data Collection

1. **Select 20-30 sugarcane fields** across different counties
2. **Record GPS coordinates** (polygon boundaries using handheld GPS)
3. **Measure actual area** (cross-check with GPS)
4. **Record planting date** (for age validation)
5. **Measure yield at harvest** (weigh bridge data)

### GEE Analysis

1. Upload field polygons to GEE as asset
2. Run classification for same time period
3. Extract predicted values for each polygon:
   ```javascript
   var validation = median.select(['YIELD_TCH', 'AGE_CLASS'])
                          .reduceRegions({
                            collection: validationFields,
                            reducer: ee.Reducer.mean(),
                            scale: 10
                          });

   print(validation);
   ```

### Accuracy Calculation

Compare predicted vs. actual:

| Field ID | Actual Yield (TCH) | Predicted Yield (TCH) | Error (%) |
|----------|--------------------|-----------------------|-----------|
| Field_01 | 95.2 | 89.7 | -5.8% |
| Field_02 | 78.5 | 82.1 | +4.6% |
| ... | ... | ... | ... |

Calculate metrics:
```
RMSE = sqrt(mean((Actual - Predicted)²))
MAPE = mean(|Actual - Predicted| / Actual) × 100%
R² = correlation coefficient squared
```

**Acceptable Performance:**
- RMSE < 15 TCH
- MAPE < 20%
- R² > 0.70

---

## Appendix C: Legal & Licensing

### Data Licensing

| Dataset | License | Usage Restrictions |
|---------|---------|-------------------|
| Sentinel-2 | Open (Copernicus) | Free for all uses, attribution required |
| Google Dynamic World | CC-BY-4.0 | Free, must cite Google/WRI |
| FAO GAUL | Public Domain | Free for all uses |
| System Code (this script) | MIT License | Free for commercial/non-commercial, attribution appreciated |

### Citation

If publishing results from this system:

**APA Style:**
```
Ecospace Services. (2025). Kenya Sugar Board Sugarcane Monitoring System (Version 2.0)
[Software]. Google Earth Engine. https://code.earthengine.google.com/
```

**Bibtex:**
```bibtex
@software{ksb_monitor_2025,
  author = {Ecospace Services},
  title = {Kenya Sugar Board Sugarcane Monitoring System},
  version = {2.0},
  year = {2025},
  url = {https://code.earthengine.google.com/}
}
```

### Disclaimer

This system provides **estimates** based on satellite remote sensing. Accuracy depends on:
- Image quality (cloud cover, atmospheric conditions)
- Ground truth data availability
- Phenological stage at time of analysis

**Limitations:**
- Not a substitute for field measurements
- Yield estimates have ~15-25% error margin
- Age classification assumes normal growth conditions
- Results should be validated with ground surveys

**Use at your own discretion.** Ecospace Services and Kenya Sugar Board are not liable for decisions made based solely on this system's outputs.

---

## Revision History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2024-06 | Initial release (original script) |
| 2.0 | 2025-11 | Complete rewrite: Added yield/age, public datasets, validation, improved UI |
| 2.1 | TBD | Planned: Time-series charts, PDF export |

---

**END OF DEPLOYMENT GUIDE**

For support: support@ecospace.com | Kenya Sugar Board: info@kenyasugar.co.ke
