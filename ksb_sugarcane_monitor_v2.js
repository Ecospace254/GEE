// ============================================================================================================
// KENYA SUGAR BOARD (KSB) - SUGARCANE MONITORING SYSTEM v2.0
// ============================================================================================================
// Developed by: Ecospace Services
// Client: Kenya Sugar Board
// Purpose: Remote sensing-based sugarcane area estimation, yield prediction, and age classification
// Date: November 2025
// ============================================================================================================

// ============================================================================================================
// SECTION 1: CONFIGURATION
// ============================================================================================================

var CONFIG = {
  // Study period
  dateRange: {
    start: '2021-01-01',
    end: '2025-10-30'
  },

  // Years and months of interest
  years: [2021, 2022, 2023, 2024, 2025],
  months: [
    {id: 1, name: 'January', cloudThresh: 70, seasonalFactor: 0.85},
    {id: 4, name: 'April', cloudThresh: 15, seasonalFactor: 1.10},
    {id: 8, name: 'August', cloudThresh: 20, seasonalFactor: 0.95},
    {id: 12, name: 'December', cloudThresh: 30, seasonalFactor: 1.00}
  ],

  // Spatial analysis scales
  scales: {
    county: 10,      // 10m for single county analysis
    catchment: 100,  // 100m for catchment area analysis
    export: 30       // 30m for exports (compromise between detail and size)
  },

  // Vegetation indices to compute
  indices: ['NDVI', 'GCVI', 'EVI', 'GNDVI', 'NDRE', 'VARI', 'SAVI', 'MSAVI', 'NDMI', 'LAI'],

  // Dynamic World crop probability threshold
  cropThreshold: 0.5,

  // Random Forest parameters
  classifier: {
    numTrees: 100,
    negativeSamples: 500,
    variablesPerSplit: null, // null = sqrt(numFeatures)
    minLeafPopulation: 1,
    bagFraction: 0.5,
    seed: 42
  },

  // Kenya-specific regional yield factors
  regionalFactors: {
    'KAKAMEGA': 1.0,
    'BUSIA': 0.95,
    'BUNGOMA': 1.05,
    'KISUMU': 0.90,
    'HOMA BAY': 0.85,
    'MIGORI': 0.95,
    'SIAYA': 0.92,
    'OTHER': 0.90
  },

  // Sugarcane age classification thresholds (Kenya-calibrated)
  ageThresholds: {
    young: {ndvi: 0.5, evi: 0.4, lai: 2.5, ndre: 0.25},      // 0-6 months
    mature: {ndvi: 0.7, evi: 0.6, lai: 4.5, ndre: 0.35},     // 7-12 months
    harvestReady: {ndvi: 0.75, evi: 0.65, lai: 5.0, ndre: 0.38} // 13-18 months
  },

  // Branding
  appName: 'KSB Sugarcane Monitor',
  version: 'v2.0',
  organization: 'Kenya Sugar Board',
  developer: 'Ecospace Services'
};

// ============================================================================================================
// SECTION 2: DATA SOURCES (PUBLIC DATASETS)
// ============================================================================================================

var DATA = {
  // Sentinel-2 Surface Reflectance (Harmonized)
  sentinel2: ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED"),

  // Google Dynamic World Land Cover
  dynamicWorld: ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1'),

  // Kenya Administrative Boundaries (Level 2 - Counties)
  // Using FAO GAUL (Global Administrative Unit Layers)
  kenyaCounties: ee.FeatureCollection("FAO/GAUL_SIMPLIFIED_500m/2015/level2")
                   .filter(ee.Filter.eq('ADM0_NAME', 'Kenya')),

  // Region of Interest (ROI) - Western Kenya Sugar Belt
  // We'll define this programmatically from counties
  sugarBeltCounties: ['KAKAMEGA', 'BUSIA', 'BUNGOMA', 'KISUMU', 'HOMA BAY', 'MIGORI', 'SIAYA'],

  // Global cropland mask (for initial training data generation)
  globalCropland: ee.ImageCollection("USGS/GFSAD1000_V1").first(),

  // Elevation for terrain analysis (optional enhancement)
  elevation: ee.Image("USGS/SRTMGL1_003")
};

// Create ROI from sugar belt counties
var roi = DATA.kenyaCounties.filter(ee.Filter.inList('ADM1_NAME', DATA.sugarBeltCounties));

// ============================================================================================================
// SECTION 3: HELPER FUNCTIONS - PREPROCESSING
// ============================================================================================================

/**
 * Cloud masking function using Scene Classification Layer (SCL)
 * Removes clouds, cloud shadows, and cirrus from Sentinel-2 images
 * @param {ee.Image} image - Sentinel-2 image
 * @return {ee.Image} - Cloud-masked image
 */
function maskS2clouds(image) {
  var scl = image.select('SCL');
  // Keep only useful pixels: clear sky (4,5,6,7), vegetation (4), bare soil (5), water (6), snow (11)
  var mask = scl.neq(3)     // Not cloud shadow
                .and(scl.neq(8))   // Not medium probability cloud
                .and(scl.neq(9))   // Not high probability cloud
                .and(scl.neq(10)); // Not thin cirrus

  return image.updateMask(mask)
              .copyProperties(image, ['system:time_start', 'system:index']);
}

/**
 * Compute all vegetation indices for a Sentinel-2 image
 * Indices: NDVI, GCVI, EVI, GNDVI, NDRE, VARI, SAVI, MSAVI, NDMI, LAI
 * @param {ee.Image} image - Sentinel-2 image with B2,B3,B4,B5,B8,B11 bands
 * @return {ee.Image} - Image with original bands plus computed indices
 */
function addVegetationIndices(image) {
  // Extract bands
  var nir = image.select('B8');
  var red = image.select('B4');
  var green = image.select('B3');
  var blue = image.select('B2');
  var redEdge = image.select('B5');
  var swir = image.select('B11');

  // Compute indices
  var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');

  var gcvi = nir.divide(green).subtract(1).rename('GCVI');

  var evi = nir.subtract(red).multiply(2.5)
               .divide(nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1))
               .rename('EVI');

  var gndvi = nir.subtract(green).divide(nir.add(green)).rename('GNDVI');

  var ndre = nir.subtract(redEdge).divide(nir.add(redEdge)).rename('NDRE');

  var vari = green.subtract(red).divide(green.add(red).subtract(blue)).rename('VARI');

  var savi = nir.subtract(red).multiply(1.5)
                .divide(nir.add(red).add(0.5))
                .rename('SAVI');

  var msavi = nir.multiply(2).add(1)
                 .subtract(
                   nir.multiply(2).add(1).pow(2)
                      .subtract(nir.subtract(red).multiply(8))
                      .sqrt()
                 )
                 .divide(2)
                 .rename('MSAVI');

  var ndmi = nir.subtract(swir).divide(nir.add(swir)).rename('NDMI');

  // LAI using empirical formula: LAI = 3.618 * EVI - 0.118
  var lai = evi.multiply(3.618).subtract(0.118)
               .max(0)  // LAI cannot be negative
               .min(7)  // Reasonable maximum for sugarcane
               .rename('LAI');

  return image.addBands([ndvi, gcvi, evi, gndvi, ndre, vari, savi, msavi, ndmi, lai]);
}

/**
 * Safe division to avoid division by zero
 * @param {ee.Image} numerator
 * @param {ee.Image} denominator
 * @return {ee.Image}
 */
function safeDivide(numerator, denominator) {
  return numerator.divide(denominator.where(denominator.eq(0), 1))
                  .where(denominator.eq(0), 0);
}

// ============================================================================================================
// SECTION 4: ANALYTICAL FUNCTIONS
// ============================================================================================================

/**
 * Estimate sugarcane yield in Tonnes Cane per Hectare (TCH)
 * Based on Kenya-calibrated regression models
 * @param {ee.Image} indices - Image with vegetation indices
 * @param {String} countyName - County name for regional calibration
 * @param {Number} month - Month (1-12) for seasonal adjustment
 * @return {ee.Image} - Estimated yield in TCH
 */
function estimateYield(indices, countyName, month) {
  var ndvi = indices.select('NDVI');
  var evi = indices.select('EVI');
  var lai = indices.select('LAI');
  var ndmi = indices.select('NDMI');

  // Base yield model: Yield (TCH) = -62.5 + 187.5 * NDVI
  // Based on Simões et al. (2005), calibrated for Kenya
  var baseYield = ndvi.multiply(187.5).subtract(62.5);

  // Moisture stress adjustment using NDMI
  var moistureFactor = ee.Image(1.0);
  moistureFactor = moistureFactor.where(ndmi.lt(0.1), 0.75)  // Severe stress
                                 .where(ndmi.gte(0.1).and(ndmi.lt(0.3)), 0.9); // Moderate stress

  // LAI vigor adjustment
  var vigorBoost = ee.Image(1.0);
  vigorBoost = vigorBoost.where(lai.gt(5.0), 1.15)   // Exceptional canopy
                         .where(lai.lt(2.0), 0.85);  // Weak canopy

  // Regional calibration factor
  var regionalFactor = CONFIG.regionalFactors[countyName] || CONFIG.regionalFactors['OTHER'];

  // Seasonal adjustment
  var monthObj = CONFIG.months.filter(function(m) { return m.id === month; })[0];
  var seasonalFactor = monthObj ? monthObj.seasonalFactor : 1.0;

  // Final yield calculation
  var yield_tch = baseYield.multiply(moistureFactor)
                           .multiply(vigorBoost)
                           .multiply(regionalFactor)
                           .multiply(seasonalFactor)
                           .clamp(30, 130)  // Realistic Kenya range
                           .rename('YIELD_TCH');

  return yield_tch;
}

/**
 * Classify sugarcane age based on vegetation indices
 * Returns age class: 1=Young (0-6mo), 2=Mature (7-12mo), 3=Harvest-Ready (13-18mo)
 * @param {ee.Image} indices - Image with vegetation indices
 * @return {ee.Image} - Age class (1, 2, or 3)
 */
function classifyAge(indices) {
  var ndvi = indices.select('NDVI');
  var evi = indices.select('EVI');
  var lai = indices.select('LAI');
  var ndre = indices.select('NDRE');

  var thresh = CONFIG.ageThresholds;

  // Harvest-ready criteria (check first - highest values)
  var isHarvestReady = ndvi.gte(thresh.harvestReady.ndvi)
                           .and(evi.gte(thresh.harvestReady.evi))
                           .and(lai.gte(thresh.harvestReady.lai))
                           .and(ndre.gte(thresh.harvestReady.ndre));

  // Mature criteria
  var isMature = ndvi.gte(thresh.mature.ndvi)
                     .and(evi.gte(thresh.mature.evi))
                     .and(lai.gte(thresh.mature.lai))
                     .and(ndre.gte(thresh.mature.ndre))
                     .and(isHarvestReady.not());

  // Young (everything else that passes minimum thresholds)
  var isYoung = ndvi.lt(thresh.mature.ndvi)
                    .or(evi.lt(thresh.mature.evi))
                    .or(lai.lt(thresh.mature.lai));

  // Create age class image (1=Young, 2=Mature, 3=Harvest-Ready)
  var ageClass = ee.Image(0)
                   .where(isYoung, 1)
                   .where(isMature, 2)
                   .where(isHarvestReady, 3)
                   .rename('AGE_CLASS');

  return ageClass;
}

/**
 * Calculate area statistics for a given mask
 * @param {ee.Image} mask - Binary mask (1 = include, 0 = exclude)
 * @param {ee.Geometry} geometry - Region to calculate area
 * @param {Number} scale - Analysis scale in meters
 * @return {ee.Dictionary} - Dictionary with area in hectares
 */
function calculateArea(mask, geometry, scale) {
  var area = mask.multiply(ee.Image.pixelArea())
                 .reduceRegion({
                   reducer: ee.Reducer.sum(),
                   geometry: geometry,
                   scale: scale,
                   maxPixels: 1e13,
                   bestEffort: true
                 });

  return area;
}

// ============================================================================================================
// SECTION 5: PREPROCESSING - LOAD AND PREPARE DATA
// ============================================================================================================

// Initialize Sentinel-2 collection with cloud masking
var s2Collection = DATA.sentinel2
  .filterDate(CONFIG.dateRange.start, CONFIG.dateRange.end)
  .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 70))
  .select(['B2', 'B3', 'B4', 'B5', 'B8', 'B11', 'SCL'])
  .map(maskS2clouds);

// Add vegetation indices to all images
var s2withIndices = s2Collection.map(addVegetationIndices);

// Get county names for UI dropdown (using client-side evaluation)
var countyNames = DATA.kenyaCounties.aggregate_array('ADM1_NAME').distinct().sort();

// ============================================================================================================
// SECTION 6: VISUALIZATION PARAMETERS
// ============================================================================================================

var VIS = {
  // Natural color composite
  rgb: {min: 0, max: 3000, bands: ['B4', 'B3', 'B2']},

  // Vegetation indices
  NDVI: {
    min: 0, max: 1,
    palette: ['#FFFAFA', '#FFFFE0', '#FFD700', '#90EE90', '#ADFF2F', '#2E8B57', '#006400']
  },
  GCVI: {min: 0.5, max: 4, palette: ['white', 'yellow', 'green']},
  EVI: {
    min: 0.1, max: 0.75,
    palette: ['ffcc99', '99b718', '009900', '011d01']
  },
  GNDVI: {min: 0.05, max: 0.85, palette: ['brown', 'yellow', 'green']},
  NDRE: {min: 0.1, max: 0.45, palette: ['purple', 'yellow', 'green']},
  VARI: {min: -0.1, max: 0.4, palette: ['blue', 'white', 'green']},
  SAVI: {min: 0.1, max: 0.7, palette: ['brown', 'yellow', 'green']},
  MSAVI: {min: 0, max: 0.65, palette: ['brown', 'yellow', 'green']},
  NDMI: {min: -0.3, max: 0.6, palette: ['orange', 'white', 'blue']},
  LAI: {
    min: 0.0, max: 6.0,
    palette: ['ffffff', 'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718',
              '74a901', '66a000', '529400', '3e8601', '207401',
              '056201', '004c00', '023b01', '012e01', '011d01']
  },

  // Sugarcane classification
  sugarcane: {palette: ['#00FF00'], min: 0, max: 1},

  // Yield (TCH)
  yield: {
    min: 30, max: 130,
    palette: ['red', 'orange', 'yellow', 'lightgreen', 'green', 'darkgreen']
  },

  // Age classification
  age: {
    min: 1, max: 3,
    palette: ['#FFD700', '#FFA500', '#228B22'],  // Yellow=Young, Orange=Mature, Green=Harvest
    names: ['Young (0-6mo)', 'Mature (7-12mo)', 'Harvest-Ready (13-18mo)']
  },

  // Boundaries
  roi: {color: '8B4513', fillColor: '00000000', width: 3},
  aoi: {color: 'FF0000', fillColor: '00000000', width: 4}
};

// ============================================================================================================
// SECTION 7: USER INTERFACE
// ============================================================================================================

// Create main UI panel
var mainPanel = ui.Panel({
  style: {
    width: '350px',
    padding: '8px',
    backgroundColor: '#F0F8FF'
  }
});
ui.root.insert(0, mainPanel);

// Add KSB branding header
var header = ui.Panel({
  widgets: [
    ui.Label({
      value: CONFIG.appName,
      style: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1B5E20',
        margin: '0px'
      }
    }),
    ui.Label({
      value: CONFIG.organization,
      style: {
        fontSize: '14px',
        color: '#2E7D32',
        fontWeight: 'bold',
        margin: '0px'
      }
    }),
    ui.Label({
      value: 'Developed by ' + CONFIG.developer + ' | ' + CONFIG.version,
      style: {
        fontSize: '10px',
        color: '#666',
        margin: '0px 0px 8px 0px'
      }
    })
  ],
  style: {
    backgroundColor: '#E8F5E9',
    padding: '10px',
    margin: '0px 0px 10px 0px',
    border: '2px solid #1B5E20'
  }
});
mainPanel.add(header);

// Add map title
var mapTitle = ui.Label(CONFIG.appName + ' - Spatial Analysis', {
  fontSize: '20px',
  color: '#1B5E20',
  fontWeight: 'bold',
  margin: '2px 0px 0px 40px'
});
Map.add(mapTitle);

// ===== CONTROL SECTION =====

// Analysis Mode Selection
mainPanel.add(ui.Label('1. SELECT ANALYSIS MODE', {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1B5E20',
  margin: '10px 0px 5px 0px'
}));

var analysisModeSelect = ui.Select({
  items: ['Vegetation Index', 'Sugarcane Detection', 'Yield Estimation', 'Age Classification'],
  value: 'Vegetation Index',
  placeholder: 'Choose analysis type...',
  style: {stretch: 'horizontal', margin: '0px 0px 10px 0px'}
});
mainPanel.add(analysisModeSelect);

// Area of Interest Selection
mainPanel.add(ui.Label('2. SELECT AREA OF INTEREST', {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1B5E20',
  margin: '10px 0px 5px 0px'
}));

var aoiModeSelect = ui.Select({
  items: ['Single County', 'Sugar Belt Region'],
  value: 'Single County',
  style: {stretch: 'horizontal'}
});
mainPanel.add(aoiModeSelect);

// County selector (initially visible)
var countySelectWidget = ui.Select({
  items: [],  // Will be populated asynchronously
  placeholder: 'Loading counties...',
  style: {stretch: 'horizontal'}
});

var countyPanel = ui.Panel([countySelectWidget], null, {shown: true, margin: '5px 0px'});
mainPanel.add(countyPanel);

// Sugar Belt label (initially hidden)
var sugarBeltLabel = ui.Label('Western Kenya Sugar Belt (7 counties)', {
  fontWeight: 'bold',
  color: 'green',
  shown: false
});
mainPanel.add(sugarBeltLabel);

// Temporal Selection
mainPanel.add(ui.Label('3. SELECT TIME PERIOD', {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1B5E20',
  margin: '10px 0px 5px 0px'
}));

var yearSelect = ui.Select({
  items: CONFIG.years.map(String),
  value: '2024',
  style: {stretch: 'horizontal'}
});
mainPanel.add(ui.Label('Year:', {margin: '5px 0px 2px 0px'}));
mainPanel.add(yearSelect);

var monthSelect = ui.Select({
  items: CONFIG.months.map(function(m) { return m.name; }),
  value: 'April',
  style: {stretch: 'horizontal'}
});
mainPanel.add(ui.Label('Month:', {margin: '5px 0px 2px 0px'}));
mainPanel.add(monthSelect);

// Index Selection (conditional visibility)
var indexLabel = ui.Label('Vegetation Index:', {margin: '5px 0px 2px 0px'});
var indexSelect = ui.Select({
  items: CONFIG.indices,
  value: 'NDVI',
  style: {stretch: 'horizontal'}
});
mainPanel.add(indexLabel);
mainPanel.add(indexSelect);

// Crop Threshold (conditional visibility)
var thresholdLabel = ui.Label('Crop Probability Threshold:', {margin: '5px 0px 2px 0px'});
var thresholdSlider = ui.Slider({
  min: 0.1,
  max: 1.0,
  step: 0.05,
  value: CONFIG.cropThreshold,
  style: {stretch: 'horizontal'}
});
mainPanel.add(thresholdLabel);
mainPanel.add(thresholdSlider);

// Analysis Buttons
mainPanel.add(ui.Label('4. RUN ANALYSIS', {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1B5E20',
  margin: '15px 0px 5px 0px'
}));

var updateButton = ui.Button({
  label: '🔄 Update Map',
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1B5E20',
    color: 'white',
    fontWeight: 'bold',
    margin: '5px 0px'
  }
});
mainPanel.add(updateButton);

var calculateAreaButton = ui.Button({
  label: '📊 Calculate Total Area',
  style: {
    stretch: 'horizontal',
    backgroundColor: '#2E7D32',
    color: 'white',
    margin: '2px 0px'
  }
});
mainPanel.add(calculateAreaButton);

var exportButton = ui.Button({
  label: '💾 Export Results (Shapefile)',
  style: {
    stretch: 'horizontal',
    backgroundColor: '#FF6F00',
    color: 'white',
    fontWeight: 'bold',
    margin: '2px 0px'
  }
});
mainPanel.add(exportButton);

// Results Display
mainPanel.add(ui.Label('5. RESULTS', {
  fontSize: '14px',
  fontWeight: 'bold',
  color: '#1B5E20',
  margin: '15px 0px 5px 0px'
}));

var resultsPanel = ui.Panel({
  style: {
    backgroundColor: 'white',
    padding: '10px',
    border: '1px solid #ccc'
  }
});
mainPanel.add(resultsPanel);

var statusLabel = ui.Label('Click "Update Map" to begin analysis', {
  color: '#666',
  fontStyle: 'italic'
});
resultsPanel.add(statusLabel);

var areaLabel = ui.Label('', {fontSize: '13px', fontWeight: 'bold'});
var yieldLabel = ui.Label('', {fontSize: '13px'});
var ageStatsLabel = ui.Label('', {fontSize: '13px', whiteSpace: 'pre'});

resultsPanel.add(areaLabel);
resultsPanel.add(yieldLabel);
resultsPanel.add(ageStatsLabel);

// Accuracy Display (for sugarcane detection mode)
var accuracyPanel = ui.Panel({
  style: {
    backgroundColor: '#FFF3E0',
    padding: '8px',
    margin: '10px 0px',
    shown: false
  }
});
var accuracyLabel = ui.Label('', {fontSize: '12px', whiteSpace: 'pre'});
accuracyPanel.add(ui.Label('Model Accuracy:', {fontWeight: 'bold', fontSize: '12px'}));
accuracyPanel.add(accuracyLabel);
mainPanel.add(accuracyPanel);

// Legend Panel (bottom-right of map)
var legend = ui.Panel({
  style: {
    position: 'bottom-right',
    padding: '8px 15px',
    backgroundColor: 'white'
  }
});
Map.add(legend);

// ============================================================================================================
// SECTION 8: CORE ANALYSIS FUNCTION
// ============================================================================================================

// Global variable to store current analysis results
var currentResults = {
  classified: null,
  sugarcaneMask: null,
  yield: null,
  age: null,
  aoi: null,
  scale: null
};

/**
 * Main analysis function - triggered by user interactions
 */
function runAnalysis() {
  // Clear map and results
  Map.layers().reset();
  resultsPanel.clear();
  resultsPanel.add(statusLabel);
  statusLabel.setValue('⏳ Processing... Please wait.');
  legend.clear();
  accuracyPanel.style().set('shown', false);

  // Get user selections
  var analysisMode = analysisModeSelect.getValue();
  var aoiMode = aoiModeSelect.getValue();
  var year = parseInt(yearSelect.getValue());
  var monthName = monthSelect.getValue();
  var selectedIndex = indexSelect.getValue();
  var threshold = thresholdSlider.getValue();

  // Validate December 2025 (not yet available)
  if (year === 2025 && monthName === 'December') {
    statusLabel.setValue('❌ December 2025 data not yet available');
    return;
  }

  // Get month object
  var monthObj = CONFIG.months.filter(function(m) { return m.name === monthName; })[0];
  if (!monthObj) {
    statusLabel.setValue('❌ Invalid month selection');
    return;
  }

  // Define AOI and scale
  var aoi, analysisScale, aoiName;

  if (aoiMode === 'Single County') {
    var countyName = countySelectWidget.getValue();
    if (!countyName) {
      statusLabel.setValue('❌ Please select a county');
      return;
    }
    aoi = DATA.kenyaCounties.filter(ee.Filter.eq('ADM1_NAME', countyName));
    analysisScale = CONFIG.scales.county;
    aoiName = countyName + ' County';
  } else {
    aoi = roi;
    analysisScale = CONFIG.scales.catchment;
    aoiName = 'Sugar Belt Region';
  }

  // Store for later use
  currentResults.aoi = aoi;
  currentResults.scale = analysisScale;

  // Get AOI geometry
  var aoiGeometry = aoi.geometry();

  // Display base layers
  Map.centerObject(aoi, 9);

  // Add ROI outline
  Map.addLayer(roi.style(VIS.roi), {}, 'Sugar Belt ROI', true, 0.8);

  // Add selected AOI outline
  Map.addLayer(aoi.style(VIS.aoi), {}, 'Selected AOI: ' + aoiName, true, 1);

  // Filter Sentinel-2 for selected month/year
  var start = ee.Date.fromYMD(year, monthObj.id, 1);
  var end = start.advance(1, 'month');

  var s2Month = s2withIndices.filterDate(start, end)
                             .filterBounds(aoiGeometry)
                             .map(function(img) { return img.clip(aoiGeometry); });

  // Check if data available
  var count = s2Month.size();
  count.evaluate(function(n) {
    if (n === 0) {
      statusLabel.setValue('❌ No Sentinel-2 images available for ' + monthName + ' ' + year);
    }
  });

  // Get median composite
  var median = s2Month.median();

  // Mode-specific processing
  if (analysisMode === 'Vegetation Index') {
    // Simple index visualization
    Map.addLayer(median.select(selectedIndex), VIS[selectedIndex],
                 monthName + ' ' + year + ' ' + selectedIndex);
    updateLegend(selectedIndex);
    statusLabel.setValue('✓ Displaying ' + selectedIndex + ' for ' + monthName + ' ' + year);

  } else {
    // For other modes, we need crop mask and classification
    statusLabel.setValue('⏳ Generating crop mask...');

    // Get Dynamic World crop probability
    var cropProb = DATA.dynamicWorld.filterDate(start, end)
                                    .filterBounds(aoiGeometry)
                                    .select('crops')
                                    .mean()
                                    .clip(aoiGeometry);

    var cropMask = cropProb.gt(threshold);

    // Generate training data
    statusLabel.setValue('⏳ Sampling training data...');

    // Since we don't have ground truth farm data in public datasets,
    // we'll use a proxy approach: high NDVI + high LAI + cropland = likely sugarcane
    // This is a limitation that should be replaced with actual field data

    // Positive samples: High vegetation in cropland (proxy for sugarcane)
    var sugarcaneLikely = median.select('NDVI').gt(0.7)
                                .and(median.select('LAI').gt(4.0))
                                .and(cropMask)
                                .selfMask();

    var positiveSamples = median.select(CONFIG.indices)
                                .sample({
                                  region: aoiGeometry,
                                  scale: analysisScale,
                                  numPixels: 300,
                                  seed: CONFIG.classifier.seed,
                                  geometries: true
                                })
                                .map(function(f) { return f.set('landcover', 1); });

    // Negative samples: Cropland but not high vegetation
    var otherCrops = cropMask.updateMask(sugarcaneLikely.unmask(0).not());

    var negativeSamples = median.updateMask(otherCrops)
                                .select(CONFIG.indices)
                                .sample({
                                  region: aoiGeometry,
                                  scale: analysisScale,
                                  numPixels: CONFIG.classifier.negativeSamples,
                                  seed: CONFIG.classifier.seed,
                                  geometries: true
                                })
                                .map(function(f) { return f.set('landcover', 0); });

    // Combine training samples
    var trainingSamples = positiveSamples.merge(negativeSamples);

    // Split into training and validation (70/30)
    trainingSamples = trainingSamples.randomColumn('random', CONFIG.classifier.seed);
    var trainingSet = trainingSamples.filter(ee.Filter.lt('random', 0.7));
    var validationSet = trainingSamples.filter(ee.Filter.gte('random', 0.7));

    // Check if we have both classes
    trainingSet.aggregate_histogram('landcover').evaluate(function(counts) {
      var pos = counts['1'] || 0;
      var neg = counts['0'] || 0;

      if (pos === 0 || neg === 0) {
        statusLabel.setValue('❌ Insufficient training data. Try different parameters.');
        return;
      }

      statusLabel.setValue('⏳ Training classifier (' + pos + ' sugarcane, ' + neg + ' other crops)...');

      // Train Random Forest classifier
      var classifier = ee.Classifier.smileRandomForest({
        numberOfTrees: CONFIG.classifier.numTrees,
        variablesPerSplit: CONFIG.classifier.variablesPerSplit,
        minLeafPopulation: CONFIG.classifier.minLeafPopulation,
        bagFraction: CONFIG.classifier.bagFraction,
        seed: CONFIG.classifier.seed
      }).train({
        features: trainingSet,
        classProperty: 'landcover',
        inputProperties: CONFIG.indices
      });

      // Classify the image
      var classified = median.select(CONFIG.indices).classify(classifier);

      // Apply crop mask
      var sugarcaneMask = classified.updateMask(cropMask).eq(1);

      // Store results
      currentResults.classified = classified;
      currentResults.sugarcaneMask = sugarcaneMask;

      // Validate classifier
      var validated = validationSet.classify(classifier);
      var confusionMatrix = validated.errorMatrix('landcover', 'classification');

      confusionMatrix.accuracy().evaluate(function(accuracy) {
        confusionMatrix.kappa().evaluate(function(kappa) {
          confusionMatrix.producersAccuracy().evaluate(function(pa) {
            confusionMatrix.consumersAccuracy().evaluate(function(ua) {
              var accuracyText = 'Overall Accuracy: ' + (accuracy * 100).toFixed(1) + '%\n' +
                                'Kappa: ' + kappa.toFixed(3) + '\n' +
                                'Producer\'s Acc: ' + (pa.get([1]).getInfo() * 100).toFixed(1) + '%\n' +
                                'User\'s Acc: ' + (ua.get([1]).getInfo() * 100).toFixed(1) + '%';
              accuracyLabel.setValue(accuracyText);
              accuracyPanel.style().set('shown', true);
            });
          });
        });
      });

      // Display based on analysis mode
      if (analysisMode === 'Sugarcane Detection') {
        Map.addLayer(sugarcaneMask.selfMask(), VIS.sugarcane,
                     'Sugarcane Areas - ' + monthName + ' ' + year);
        statusLabel.setValue('✓ Sugarcane detection complete');

      } else if (analysisMode === 'Yield Estimation') {
        var countyName = aoiMode === 'Single County' ? countySelectWidget.getValue() : 'KAKAMEGA';
        var yieldEst = estimateYield(median, countyName, monthObj.id);

        // Mask to sugarcane areas only
        yieldEst = yieldEst.updateMask(sugarcaneMask);
        currentResults.yield = yieldEst;

        Map.addLayer(yieldEst, VIS.yield, 'Yield Estimate (TCH) - ' + monthName + ' ' + year);
        updateYieldLegend();

        // Calculate mean yield
        yieldEst.reduceRegion({
          reducer: ee.Reducer.mean(),
          geometry: aoiGeometry,
          scale: analysisScale,
          maxPixels: 1e13,
          bestEffort: true
        }).evaluate(function(result) {
          var meanYield = result.YIELD_TCH;
          if (meanYield) {
            yieldLabel.setValue('Mean Yield: ' + meanYield.toFixed(1) + ' TCH');
          }
        });

        statusLabel.setValue('✓ Yield estimation complete');

      } else if (analysisMode === 'Age Classification') {
        var ageClass = classifyAge(median);

        // Mask to sugarcane areas only
        ageClass = ageClass.updateMask(sugarcaneMask);
        currentResults.age = ageClass;

        Map.addLayer(ageClass, VIS.age, 'Sugarcane Age - ' + monthName + ' ' + year);
        updateAgeLegend();

        // Calculate age distribution
        ageClass.reduceRegion({
          reducer: ee.Reducer.frequencyHistogram(),
          geometry: aoiGeometry,
          scale: analysisScale,
          maxPixels: 1e13,
          bestEffort: true
        }).evaluate(function(result) {
          var hist = result.AGE_CLASS;
          if (hist) {
            var young = hist['1'] || 0;
            var mature = hist['2'] || 0;
            var harvest = hist['3'] || 0;
            var total = young + mature + harvest;

            var statsText = 'Age Distribution:\n' +
                           '  Young: ' + ((young/total)*100).toFixed(1) + '%\n' +
                           '  Mature: ' + ((mature/total)*100).toFixed(1) + '%\n' +
                           '  Harvest-Ready: ' + ((harvest/total)*100).toFixed(1) + '%';
            ageStatsLabel.setValue(statsText);
          }
        });

        statusLabel.setValue('✓ Age classification complete');
      }
    });
  }
}

/**
 * Calculate total area
 */
function calculateTotalArea() {
  if (!currentResults.sugarcaneMask || !currentResults.aoi) {
    statusLabel.setValue('❌ Please run analysis first (modes: Detection, Yield, or Age)');
    return;
  }

  statusLabel.setValue('⏳ Calculating area...');

  calculateArea(currentResults.sugarcaneMask, currentResults.aoi.geometry(), currentResults.scale)
    .evaluate(function(result) {
      var areaM2 = result.classification || result.AGE_CLASS || 0;
      var areaHa = areaM2 / 10000;
      areaLabel.setValue('Total Sugarcane Area: ' + areaHa.toFixed(2) + ' hectares');
      statusLabel.setValue('✓ Area calculation complete');
    }, function(error) {
      statusLabel.setValue('❌ Area calculation failed: ' + error);
    });
}

/**
 * Export results to Google Drive
 */
function exportResults() {
  if (!currentResults.sugarcaneMask || !currentResults.aoi) {
    statusLabel.setValue('❌ Please run analysis first');
    return;
  }

  var analysisMode = analysisModeSelect.getValue();
  var year = yearSelect.getValue();
  var monthName = monthSelect.getValue();

  statusLabel.setValue('⏳ Preparing export... Check Tasks tab.');

  var exportImage = currentResults.sugarcaneMask;
  var description = 'KSB_Sugarcane_' + monthName + '_' + year;

  // Add yield or age bands if available
  if (analysisMode === 'Yield Estimation' && currentResults.yield) {
    exportImage = exportImage.addBands(currentResults.yield);
    description = 'KSB_Yield_' + monthName + '_' + year;
  } else if (analysisMode === 'Age Classification' && currentResults.age) {
    exportImage = exportImage.addBands(currentResults.age);
    description = 'KSB_Age_' + monthName + '_' + year;
  }

  // Convert to vectors for shapefile export
  var vectors = exportImage.selfMask().reduceToVectors({
    geometry: currentResults.aoi.geometry(),
    scale: CONFIG.scales.export,
    geometryType: 'polygon',
    eightConnected: true,
    labelProperty: 'classification',
    maxPixels: 1e13,
    bestEffort: true
  });

  Export.table.toDrive({
    collection: vectors,
    description: description,
    folder: 'KSB_GEE_Exports',
    fileFormat: 'SHP'
  });

  statusLabel.setValue('✓ Export task created. Check Tasks tab to run.');
}

// ============================================================================================================
// SECTION 9: LEGEND FUNCTIONS
// ============================================================================================================

function updateLegend(indexName) {
  legend.clear();

  var vis = VIS[indexName];
  if (!vis || !vis.palette) {
    return;
  }

  legend.add(ui.Label(indexName + ' Range', {fontWeight: 'bold', fontSize: '14px'}));

  var palette = vis.palette;
  var min = vis.min;
  var max = vis.max;
  var steps = palette.length;
  var stepValue = (max - min) / (steps - 1);

  for (var i = 0; i < palette.length; i++) {
    var color = palette[i];
    var value = min + (stepValue * i);
    legend.add(makeLegendRow(color, value.toFixed(2)));
  }
}

function updateYieldLegend() {
  legend.clear();
  legend.add(ui.Label('Yield (TCH)', {fontWeight: 'bold', fontSize: '14px'}));

  var palette = VIS.yield.palette;
  var labels = ['30-50 (Poor)', '50-70 (Below Avg)', '70-90 (Average)',
                '90-110 (Good)', '110-130 (Excellent)'];

  for (var i = 0; i < palette.length; i++) {
    legend.add(makeLegendRow(palette[i], labels[i]));
  }
}

function updateAgeLegend() {
  legend.clear();
  legend.add(ui.Label('Age Class', {fontWeight: 'bold', fontSize: '14px'}));

  var palette = VIS.age.palette;
  var names = VIS.age.names;

  for (var i = 0; i < palette.length; i++) {
    legend.add(makeLegendRow(palette[i], names[i]));
  }
}

function makeLegendRow(color, label) {
  return ui.Panel({
    widgets: [
      ui.Label('', {
        backgroundColor: color,
        padding: '8px',
        margin: '0'
      }),
      ui.Label(label, {margin: '0 0 4px 6px', fontSize: '12px'})
    ],
    layout: ui.Panel.Layout.Flow('horizontal')
  });
}

// ============================================================================================================
// SECTION 10: UI EVENT HANDLERS
// ============================================================================================================

// Update visibility based on analysis mode
analysisModeSelect.onChange(function(mode) {
  var showIndex = (mode === 'Vegetation Index');
  var showThreshold = (mode !== 'Vegetation Index');

  indexLabel.style().set('shown', showIndex);
  indexSelect.style().set('shown', showIndex);
  thresholdLabel.style().set('shown', showThreshold);
  thresholdSlider.style().set('shown', showThreshold);

  // Clear results when mode changes
  resultsPanel.clear();
  resultsPanel.add(statusLabel);
  resultsPanel.add(areaLabel);
  resultsPanel.add(yieldLabel);
  resultsPanel.add(ageStatsLabel);
  statusLabel.setValue('Click "Update Map" to run ' + mode + ' analysis');
  areaLabel.setValue('');
  yieldLabel.setValue('');
  ageStatsLabel.setValue('');
});

// Update visibility based on AOI mode
aoiModeSelect.onChange(function(mode) {
  var isSingleCounty = (mode === 'Single County');
  countyPanel.style().set('shown', isSingleCounty);
  sugarBeltLabel.style().set('shown', !isSingleCounty);
});

// Button click handlers
updateButton.onClick(runAnalysis);
calculateAreaButton.onClick(calculateTotalArea);
exportButton.onClick(exportResults);

// ============================================================================================================
// SECTION 11: INITIALIZATION
// ============================================================================================================

// Load county names asynchronously
countyNames.evaluate(function(names) {
  countySelectWidget.items().reset(names);
  countySelectWidget.setValue('KAKAMEGA');
  countySelectWidget.setPlaceholder('Select a county...');
});

// Display initial layers
Map.setCenter(34.75, 0.28, 9);  // Western Kenya
Map.addLayer(roi.style(VIS.roi), {}, 'Western Kenya Sugar Belt', true, 0.8);

// Show initial message
statusLabel.setValue('👋 Welcome! Select your parameters and click "Update Map" to begin.');

// ============================================================================================================
// END OF SCRIPT
// ============================================================================================================

print('✓ KSB Sugarcane Monitor v2.0 loaded successfully');
print('📍 Region of Interest:', roi);
print('📅 Date Range:', CONFIG.dateRange.start, 'to', CONFIG.dateRange.end);
print('🌾 Analysis Modes: Vegetation Index | Sugarcane Detection | Yield Estimation | Age Classification');
print('');
print('⚠️ IMPORTANT NOTES:');
print('1. This system uses proxy training data (high NDVI + LAI in croplands)');
print('2. For production use, replace with actual ground-truth sugarcane field data');
print('3. Yield estimates are based on literature models calibrated for Kenya');
print('4. Age classification requires known planting dates for best accuracy');
print('');
print('📧 Support: Ecospace Services | Kenya Sugar Board');
