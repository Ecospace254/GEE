// ============================================================================================================
// ------------------------------------------------ INITIAL STEPS
// ============================================================================================================

// --- 🛑 IMPORTANT ---
// The AOI is now defined by the user in the UI panel

// Load variables & datasets
var s2 = ee.ImageCollection("COPERNICUS/S2_SR_HARMONIZED"); // Harmonized Sentinel 2 dataset
var euroCropMap = ee.ImageCollection("JRC/D5/EUCROPMAP/V1"); // JRC & ESA collaboration

//-------- Define the date range for the study
var startRangeDate = '2021-01-01';
var endRangeDate = '2025-10-30'; // This date will change as time progresses, to cater for Dec

//-------- Define selected years (useful in looping)
var years = [2021, 2022, 2023, 2024, 2025];

// --- NEW: Load Kenya Admin Level 2 (Counties) ---
// var admin2 = ee.FeatureCollection("FAO/GAUL/2015/level2"); // Outdated
// var kenyaCounties = counties.filter(ee.Filter.eq('ADM0_NAME', 'Kenya'));
// print (kenyaCounties)
// Get a list of county names for the UI. This is a client-side call.
var countyNames = kenyaCounties.aggregate_array('NAME').sort().getInfo();

//-------- Call the map centre function
// Map.centerObject(aoi, 11); // REMOVED - This is now done in updateMap()

//-------- Display the main coverage area.
Map.addLayer(roi.style({
                        color: '8B4513',
                        fillColor: '00000000',
                        width: 3
                      }),
                      {},
                      'KSB ROI'
                      );

// Load sugarcane field polygons - initially shared as shapefiles
var caneFarms = butali.merge(nzoia).merge(b001).merge(b003)
                      .merge(dulienge).merge(mailiSaba).merge(aladoi)
                      .merge(butula).merge(elugulu).merge(matisi)
                      .merge(matumbei).merge(matunda);
print (caneFarms);
//-------- Display the sugarcane farms.
Map.addLayer(caneFarms.style({
                        color: 'yellow',
                        fillColor: '00000000',
                        width: 2
                      }),
                      {},
                      'Sugarcane Farms'
                      );


//-------- Use the SCL (Scene Classification Layer) band to mask clouds shadows
function maskS2clouds(image) {
                              var scl = image.select('SCL');
                              //..............Keep only useful pixels
                              var mask = scl.neq(3) // cloud shadow
                                            .and(scl.neq(8)) // medium probability cloud
                                          .and(scl.neq(9)) // high probability cloud
                                            .and(scl.neq(10)); // thin cirrus
                              return image.updateMask(mask);
                             }

//-------- Initialize the main sentinel 2 dataset
//---------------------- (Note that in January 2021, no full image will be produced if Cloud percentage is set to less than 70%)
var initializedS2 = s2.filterDate(startRangeDate, endRangeDate).filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', 70)).select('B.*', 'SCL').map(maskS2clouds);


// ===============================================================================================================
// ------------------------------------- Compute chosen spectral indices
// ===============================================================================================================
//-------- Indices to be computed
var indices = ['NDVI', 'GCVI', 'EVI', 'GNDVI', 'NDRE', 'VARI', 'SAVI', 'MSAVI', 'NDMI', 'LAI'];
//-------- Function to compute all indices
function addVegetationIndices(image) {
                                        var nir = image.select('B8');
                                        var red = image.select('B4');
                                        var green = image.select('B3');
                                        var blue = image.select('B2');
                                        var redEdge = image.select('B5');
                                        var swir = image.select('B11');

                                        //......... Vegetation Indices
                                        var ndvi = nir.subtract(red).divide(nir.add(red)).rename('NDVI');
                                        var gcvi = nir.divide(green).subtract(1).rename('GCVI');
                                        var gndvi = nir.subtract(green).divide(nir.add(green)).rename('GNDVI');
                                        var ndre = nir.subtract(redEdge).divide(nir.add(redEdge)).rename('NDRE');
                                        var vari = green.subtract(red).divide(green.add(red).subtract(blue)).rename('VARI');
                                        var savi = nir.subtract(red).multiply(1.5).divide(nir.add(red).add(0.5)).rename('SAVI');
                                        var msavi = nir.multiply(2).add(1).subtract(nir.multiply(2).add(1).pow(2).subtract(nir.subtract(red).multiply(8)).sqrt()
                                                                                   ).divide(2).rename('MSAVI');
                                        var ndmi = nir.subtract(swir).divide(nir.add(swir)).rename('NDMI');
                                          // EVI formula: 2.5 * (NIR - Red) / (NIR + 6*Red - 7.5*Blue + 1)
                                        var evi = nir.subtract(red).multiply(2.5).divide(nir.add(red.multiply(6)).subtract(blue.multiply(7.5)).add(1)).rename('EVI');
                                        // Calculate LAI using a single expression, combining EVI calculation
                                        // (2.5 * ((NIR - RED) / (NIR + 6 * RED - 7.5 * BLUE + 1)))
                                        // and the LAI empirical formula (3.618 * EVI - 0.118).
                                     // Calculate LAI: (3.618 * EVI) - 0.118
                                        var lai = evi.multiply(3.618).subtract(0.118).rename('LAI')
                                                     .max(0) // LAI cannot be negative.
                                                     .min(7); // Clipping to a reasonable maximum value for most terrestrial vegetation.
                                      return image.addBands([ndvi, gcvi, evi, gndvi, ndre, vari, savi, msavi, ndmi, lai]);
                                      }

// Add indices to all images in the collection for chosen dates for start & end of our range
var s2withIndices = initializedS2.map(addVegetationIndices);

//-------- Define the visualization parameters for Natural Colour mapping
var rgbVis = {min: 0.0, max: 3000, bands: ['B4', 'B3', 'B2']};

//-------- Define common visualization parameters for the selected indices
var visParams = { // Vegetation Indices (Non-Veg -> Low -> High)
                  NDVI:  {min: 0, max: 1, palette: ['#FFFAFA', // Bare soil / rock (0 – 0.1) # Shade of white
                                                    '#FFFFE0', // Sparse vegetation / urban (0.1 – 0.2) # Very light yellow
                                                    '#FFD700', // Grassland or dry crops (0.2 – 0.3) # Yellow to orange
                                                    '#90EE90', // Moderate vegetation (0.3 – 0.4) # Pale light green
                                                    '#ADFF2F', // Healthy crops (0.4 – 0.5) # Light green
                                                    '#2E8B57', // Forest / plantations (0.5 – 0.7) # Moderate green
                                                    '#006400'  // Dense tropical forest (> 0.7) # Dark green
                                                   ]

                          },
                  GCVI:  {min: 0.5, max: 4, palette: ['white', 'yellow', 'green']},
                  EVI:   {min: 0.1, max: 0.75, palette: ['ffcc99', // Sparse/Stressed Vegetation
                                                         '99b718', // Medium Vegetation
                                                         '009900', // Dense Vegetation
                                                         '011d01' // Max EVI
                                                        ]},
                  GNDVI: {min: 0.05, max: 0.85, palette: ['brown', 'yellow', 'green']},
                  NDRE:  {min: 0.1, max: 0.45, palette: ['purple', 'yellow', 'green']},
                  VARI:  {min: -0.1, max: 0.4, palette: ['blue', 'white', 'green']},
                  SAVI:  {min: 0.1, max: 0.7, palette: ['brown', 'yellow', 'green']},
                  MSAVI: {min: 0, max: 0.65, palette: ['brown', 'yellow', 'green']},
                  NDMI:  {min: -0.3, max: 0.6, palette: ['orange', 'white', 'blue']},
                  LAI: {min: 0.0, max: 6.0, palette: ['ffffff', // bare soil/water (low LAI)
                        'ce7e45', 'df923d', 'f1b555', 'fcd163', '99b718', // increasing LAI
                       '74a901', '66a000', '529400', '3e8601', '207401', // mid-high LAI
                        '056201', '004c00', '023b01', '012e01', '011d01', // high LAI
                       ]}
                };

//-------- Define colours for indices to specific colors for the charts.
//--- This allows each index to have a consistent color when charted.
var indexColors = {
                    'NDVI': 'red',
                    'GCVI': 'green',
                    'EVI': 'blue',
                    'GNDVI': 'darkgreen',
                    'NDRE': 'purple',
                    'VARI': 'orange',
                    'SAVI': 'brown',
                    'MSAVI': 'teal',
                    'NDMI': 'magenta',
                    'LAI': 'black'
                  };

//-------- Print the coverage areas.
print('Region of Interest boundary', roi);

// ===============================================================================================================
// ------------------------------------- Loop over chosen years and months
// ===============================================================================================================
// This is the user's original loop. It runs on script load.
// Note: This does NOT use the dynamically selected AOI. It uses the hard-coded 'aoi' if it still exists.
// The UI logic in updateMap() is separate and *does* use the new dynamic AOI.
//-------- Use years and define months of interest
var s2months = [
                {month: '01', name: 'January', cloudThresh: 70},
                {month: '04', name: 'April', cloudThresh: 15},
                {month: '08', name: 'August', cloudThresh: 20},
                {month: '12', name: 'December', cloudThresh: 30}
             ];

//-------- Loop through years and months
years.forEach(function(year) {
                                s2months.forEach(function(m) {
                                                              // Skip December 2025 explicitly - pending passing of time
                                                              if (year === 2025 && m.month === '12') {
                                                                                                        return; // Don't process this month
                                                                                                     }
                                                              var start = ee.Date(year + '-' + m.month + '-01');
                                                              var end = start.advance(1, 'month'); // Automatically handles month length

                                                              // Filter Sentinel-2 with indices for the given month/year
                                                              var monthlyFiltered = s2withIndices.filterDate(start, end)
                                                                                                 .filter(ee.Filter.lt('CLOUDY_PIXEL_PERCENTAGE', m.cloudThresh))
                                                                                                 .map(function(image) {
                                                                                                                        // This will error if 'aoi' is not defined.
                                                                                                                      // return image.clip(aoi); //clipToCollection if FC
                                                                                                                      return image; // Removed clip to avoid error
                                                                                                                    });
                                                              // Get median composite
                                                              var medianImage = monthlyFiltered.median();
                                                              // Add layer for each index
                                                              indices.forEach(function(indexName) {
                                                                                                    Map.addLayer(
                                                                                                              medianImage.select(indexName),
                                                                                                                  visParams[indexName],
                                                                                                                  m.name + ' ' + year + ' ' + indexName,
                                                                                                                  indexName === 'NDVI' // Only show NDVI by default, others off
                                                                                         );
                                                             });
                                                            });
                            });


// ==========================================================================================================================================================================
// --------------------------------- DYNAMIC WORLD: Cropland extraction
// ==========================================================================================================================================================================
// Note: This section does NOT use the dynamically selected AOI.
// UI logic in updateMap() is separate and *does* use the new dynamic AOI.

var dw = ee.ImageCollection('GOOGLE/DYNAMICWORLD/V1');
var months = [1, 4, 8, 12];
// var years = ee.List.sequence(2021, 2025); // Already defined
var monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                  'July', 'August', 'September', 'October', 'November', 'December'];
var cropMaskVis = {palette: ['00000000', '#00FF00'], min: 0, max: 1}; // Transparent + green

// ===================================================================
// ==================== INTERACTIVE USER INTERFACE ===================
// ===================================================================

// -------------------- UI Controls --------------------
// === Main Panel: Green background ===
var uiPanel =  ui.Panel({style: {width: '300px'}});
ui.root.insert(0, uiPanel);

// Add a title to the map
var title = ui.Label('Cane Areas & Crop Cover Estimation');
title.style().set({
                    fontSize: '22px',
                    color: 'darkblue',
                    fontWeight: 'bold',
                    margin: '2px 0px 0px 40px'
                });
Map.add(title);

uiPanel.add(ui.Label('Cane Estimation & Classification', { fontSize: '18px', color: 'darkgreen', fontWeight: 'bold'}));

// === Styled Label: White text ===
var displayTypeLabel = ui.Label('Select Display', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
});

// === Styled Dropdown (Select Widget) ===
var displayTypeSelect = ui.Select({
  items: ['Vegetation Index', 'Sugarcane Areas'],
  value: 'Vegetation Index',
  onChange: updateMap,
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1E90FF', // Blue
    color: 'black',
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '2px 0 8px 0',
    padding: '4px'
  }
});

// === Add to Panel
uiPanel.add(displayTypeLabel);
uiPanel.add(displayTypeSelect);


// Pre-declare variables
var areaModeSelect = null;
var singleCountySelect = null;
var singleCountyPanel = null;
var catchmentLabel = null;

// NEW: Pre-declare labels and widgets we want to hide
var indexLabel = null;
var indexSelect = null;
var thresholdLabel = null;
var thresholdSlider = null;

// === NEW: County Selection Logic ===
uiPanel.add(ui.Label('Select Area of Interest', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
}));

// Dropdown to choose single or multi-county mode
var countyModeSelect = ui.Select({
  items: ['Single County', 'Catchment Area'],
  value: 'Single County',
  onChange: updateAreaSelectors, // This is a new helper function
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1E90FF', // Blue
    color: 'black',
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '2px 0 4px 0',
    padding: '3px'
  }
});
uiPanel.add(countyModeSelect);

// Panel for single county dropdown (initially visible)
var singleCountySelect = ui.Select({
  items: countyNames,
  value: 'KAKAMEGA', // Default to Kakamega county
  onChange: updateMap,
  style: {stretch: 'horizontal'}
});
var singleCountyPanel = ui.Panel([singleCountySelect], null, {shown: true});
uiPanel.add(singleCountyPanel);

// 2. Simple label for the Catchment area (initially hidden)
var catchmentLabel = ui.Label('Catchment Area Loaded', {
                                                        fontWeight: 'bold',
                                                        color: 'green'
                                                      });
catchmentLabel.style().set('shown', false); // Starts hidden
uiPanel.add(catchmentLabel);


// === END NEW UI ===


// Year Selector
var yearSelect = ui.Select({
  items: ['2021', '2022', '2023', '2024', '2025'],
  value: '2021',
  onChange: updateMap,
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1E90FF', // Blue
    color: 'black',
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '2px 0 4px 0',
    padding: '3px'
  }
});
uiPanel.add(ui.Label('Select Year:', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
}));
uiPanel.add(yearSelect);

// Month Selector
var monthSelect = ui.Select({
  items: ['January', 'April', 'August', 'December'],
  value: 'January',
  onChange: updateMap,
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1E90FF', // Blue
    color: 'black',
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '2px 0 4px 0',
    padding: '3px'
  }
});
uiPanel.add(ui.Label('Select Month:', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
}));
uiPanel.add(monthSelect);

// Index Selector
indexLabel = ui.Label('Select Vegetation Index:', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
});
indexSelect = ui.Select({
  items: indices,
  value: 'NDVI',
  onChange: updateMap,
  style: {
    stretch: 'horizontal',
    backgroundColor: '#1E90FF', // Blue
    color: 'black',
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '2px 0 4px 0',
    padding: '3px'
  }
});
uiPanel.add(indexLabel);
uiPanel.add(indexSelect);


// Crop probability threshold
thresholdLabel = ui.Label('Crop Probability Threshold (Dynamic World):', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
});
thresholdSlider = ui.Slider({
  min: 0.1, max: 1.0, step: 0.05, value: 0.5,
  onChange: updateMap
});
uiPanel.add(thresholdLabel);
uiPanel.add(thresholdSlider);


// Area display
// Area display
var areaLabel = ui.Label('Sugarcane area: -- hectares', {
  color: 'black',
  fontWeight: 'bold',
  fontSize: '12px',
  margin: '6px 0 10px 0'
});
uiPanel.add(areaLabel);

// --- NEW EXPORT BUTTON ---
var exportButton = ui.Button({
  label: 'Export Sugarcane Areas (to Drive)',
  onClick: exportSugarcaneVectors, // New function
  style: {
    stretch: 'horizontal',
    backgroundColor: '#FF4500', // OrangeRed
    color: 'blue',
    fontWeight: 'bold',
    margin: '10px 0 0 0'
  }
});
uiPanel.add(exportButton);
// --- END NEW EXPORT BUTTON ---


// --- HELPER FUNCTION ---
// Shows/hides the single or multi-county selectors
var updateAreaSelectors = function(mode) {
  var isSingleCounty = (mode === 'Single County');

  // Show/Hide the County dropdown panel
  singleCountyPanel.style().set('shown', isSingleCounty);

  // Show/Hide the Catchment status label
  catchmentLabel.style().set('shown', !isSingleCounty);

  // Trigger the map update logic
  updateMap();
};
// --- END NEW FUNCTION ---


// ===================================================================
// Function: Update the map layers and prediction
// ===================================================================
function updateMap() {

  // --- NEW AOI LOGIC ---
  // Define the AOI based on UI selections
  var mode = countyModeSelect.getValue();
  var aoi; // This will be the geometry used for analysis
  var analysisScale; // This will be the scale used for analysis

  if (mode === 'Single County') {
    var selectedCountyName = singleCountySelect.getValue();
    if (!selectedCountyName) {
      print('No county selected.');
      return; // Stop if no county is chosen
    }
    var aoiFeatures = kenyaCounties.filter(ee.Filter.eq('NAME', selectedCountyName));
    aoi = aoiFeatures.union(); // Union the features into a single geometry.
    analysisScale = 10; // Use 10m scale for single county
  } else { // Mode is 'Catchment Area'
    // Use the preloaded 'roi' asset. .union() will merge all features in the asset.
    aoi = roi.union();
    analysisScale = 100; // Use 100m scale for catchment as requested (between 20-100)
  }
  // --- END NEW AOI LOGIC ---

  var year = parseInt(yearSelect.getValue());
  var monthName = monthSelect.getValue();
  var index = indexSelect.getValue();
  var threshold = thresholdSlider.getValue();
  var displayType = displayTypeSelect.getValue();

  // ==========================================================
  // --- 💡 NEW UI VISIBILITY LOGIC ---
  // ==========================================================
  // Check the selected display type
  var isVegIndexMode = (displayType === 'Vegetation Index');

  // Show/Hide the Vegetation Index dropdown and its label
  // These should ONLY be visible if in 'Vegetation Index' mode
  indexLabel.style().set('shown', isVegIndexMode);
  indexSelect.style().set('shown', isVegIndexMode);

  // Show/Hide the Crop Threshold slider and its label
  // These should ONLY be visible if in 'Sugarcane Areas' mode
  thresholdLabel.style().set('shown', !isVegIndexMode);
  thresholdSlider.style().set('shown', !isVegIndexMode);
  // ==========================================================
  // --- END NEW UI VISIBILITY LOGIC ---
  // ==========================================================


  var monthMap = {
    'January': 1,
    'April': 4,
    'August': 8,
    'December': 12
  };

  if (year === 2025 && monthName === 'December') {
    uiPanel.add(ui.Label('⚠️ December 2025 is excluded'));
    return;
  }

  var month = monthMap[monthName];
  var start = ee.Date.fromYMD(year, month, 1);
  var end = start.advance(1, 'month');

  // Clear map and reset
  Map.layers().reset();
  Map.centerObject(aoi, 9); // This now centers on the user-selected AOI

   //-------- Display the entire coverage area.
  Map.addLayer(roi.style({
                      color: '8B4513',
                      fillColor: '00000000',
                      width: 3
                    }),
                    {},
                    'KSB ROI'
                    );

  // Style parameters: no fill, dark red border
  var outlineStyle = {
                      color: 'FF0000',     // Outline color
                      fillColor: '00000000', // Transparent fill (8-digit hex with 00 alpha)
                      width: 4              // Outline width in pixels
                     };

  // Add to map
  var styledAOI= aoi.style(outlineStyle);
  Map.addLayer(styledAOI, {}, 'Selected Area of Interest');

  // Filter Sentinel-2
  var s2Month = s2withIndices.filterDate(start, end)
                           .map(function(img){ return img.clip(aoi); });
    var median = s2Month.median();

  // Crop mask
  var cropProb = dw.filterDate(start, end).filterBounds(aoi).select('crops').mean().clip(aoi);
  var cropMask = cropProb.gt(threshold);

  // Training data
  var cropMaskVector = cropMask.selfMask().reduceToVectors({
    geometry: aoi,
    geometryType: 'polygon',
    scale: analysisScale, // MODIFIED: Uses dynamic scale
    maxPixels: 1e13
   });

  var positive = caneFarms.filterBounds(cropMaskVector.geometry()).map(function(f){
    return f.set('landcover', 1);
  });

  var positiveSamples = median.sampleRegions({
    collection: positive,
    properties: ['landcover'],
    scale: analysisScale, // MODIFIED: Uses dynamic scale
    geometries: true
  });

  var nonSugarcaneMask = cropMask.updateMask(cropMask).paint(caneFarms.geometry(), 0).unmask(1);

  var negativeSamples = median.updateMask(nonSugarcaneMask).sample({
    region: aoi,
    scale: analysisScale, // MODIFIED: Uses dynamic scale
    numPixels: 500,
    geometries: true
  }).map(function(f) {
    return f.set('landcover', 0);
  });

  var trainingSamples = positiveSamples.merge(negativeSamples);

  trainingSamples.aggregate_histogram('landcover').evaluate(function(counts){
    var pos = counts['1'] || 0;
    var neg = counts['0'] || 0;

    if (pos > 0 && neg > 0) {
      var classifier = ee.Classifier.smileRandomForest(100).train({
        features: trainingSamples,
        classProperty: 'landcover',
        inputProperties: indices
      });

      var classified = median.select(indices).classify(classifier);
      var sugarcaneMask = classified.updateMask(cropMask).eq(1);

      if (displayType === 'Vegetation Index') {
        // Show only the selected index
        Map.addLayer(median.select(index), visParams[index], monthName + ' ' + year + ' ' + index);
       updateLegend(index);
        areaLabel.setValue(''); // No area for index view
      } else {
        // Show only sugarcane mask
        Map.addLayer(sugarcaneMask.selfMask(), {palette: ['#00FF00']}, monthName + ' ' + year + ' sugarcane prediction');
        legend.clear(); // Hide legend for sugarcane mask

        // Calculate area in hectares
        var area = sugarcaneMask.multiply(ee.Image.pixelArea())
                           .reduceRegion({
                             reducer: ee.Reducer.sum(),
                             geometry: aoi,
                             scale: analysisScale,  // MODIFIED: Uses dynamic scale
                             maxPixels: 1e13
                           }).get('classification');

        area.evaluate(function(ha){
          if (ha !== null) {
            areaLabel.setValue('Sugarcane area: ' + (ha / 10000).toFixed(2) + ' ha');
          } else {
            areaLabel.setValue('Sugarcane area: (unavailable)');
          }
        });
      }

    } else {
      areaLabel.setValue('Sugarcane area: (not enough training data)');
      var warningLabel = ui.Label(monthName + ' ' + year + ' skipped: Only one class found.', {color: 'red'});
      uiPanel.add(warningLabel);
      // Remove the warning after a few seconds
      ui.util.setTimeout(function() {
        uiPanel.remove(warningLabel);
      }, 5000);
    }
  });
}


// ============================ Dynamic Legend ============================
var legend = ui.Panel({style: {position: 'bottom-right', padding: '8px 15px'}});
Map.add(legend);

// Function to clear & rebuild legend dynamically
function updateLegend(indexName) {
  legend.clear();

  var vis = visParams[indexName];
  if (!vis || !vis.palette) {
    legend.add(ui.Label('No legend available'));
    return;
  }

  legend.add(ui.Label(indexName + ' Range', {fontWeight: 'bold'}));

  var palette = vis.palette;
  var min = vis.min;
  var max = vis.max;
  var steps = palette.length;
  var stepValue = (max - min) / (steps - 1);

  for (var i = 0; i < palette.length; i++) {
    var color = palette[i];
    var label = min + (stepValue * i);
    legend.add(makeLegendRow(color, label.toFixed(2)));
  }
}

// Helper to make a row in the legend
function makeLegendRow(color, label) {
  return ui.Panel([
    ui.Label('', {
      backgroundColor: color,
      padding: '8px',
      margin: '0'
    }),
    ui.Label(label, {margin: '0 0 4px 6px'})
  ], ui.Panel.Layout.Flow('horizontal'));
}

// ============================ Initial Run ============================
// Trigger the map update on initial load with default values
updateMap();

// ===================================================================
// Function: Export Sugarcane Polygons as Vectors
// ===================================================================
function exportSugarcaneVectors() {

  // Show a "working" label
  var workingLabel = ui.Label('Processing export... see Tasks tab.', {color: 'blue'});
  uiPanel.add(workingLabel);

  // --- 1. Get all current UI settings (same as updateMap) ---
  var mode = countyModeSelect.getValue();
  var aoi;
  var analysisScale;

  if (mode === 'Single County') {
    var selectedCountyName = singleCountySelect.getValue();
    aoi = kenyaCounties.filter(ee.Filter.eq('NAME', selectedCountyName)).union();
    analysisScale = 10;
  } else { // 'Catchment Area'
    aoi = roi.union();
    analysisScale = 100;
  }

  var year = parseInt(yearSelect.getValue());
  var monthName = monthSelect.getValue();
  var threshold = thresholdSlider.getValue();

  // Create a month map object locally for this function
  var monthMap = {
    'January': 1,
    'April': 4,
    'August': 8,
    'December': 12
  };
  var month = monthMap[monthName];

  // --- MODIFIED: Reverted to 1-Month Time Window ---
  var start = ee.Date.fromYMD(year, month, 1);
  var end = start.advance(1, 'month');
  var exportLabel = monthName + '_' + year;
  // --- END MODIFICATION ---

  // --- 2. Re-run analysis (minimal version) ---
  var s2Month = s2withIndices.filterDate(start, end)
                           .map(function(img){ return img.clip(aoi); });
  var median = s2Month.median();

  var cropProb = dw.filterDate(start, end).filterBounds(aoi).select('crops').mean().clip(aoi);
  var cropMask = cropProb.gt(threshold);

  // Training data
  var cropMaskVector = cropMask.selfMask().reduceToVectors({
    geometry: aoi,
    geometryType: 'polygon',
    scale: analysisScale,
    maxPixels: 1e13
  });

  var positive = caneFarms.filterBounds(cropMaskVector.geometry()).map(function(f){
    return f.set('landcover', 1);
  });

  var positiveSamples = median.sampleRegions({
    collection: positive,
    properties: ['landcover'],
    scale: analysisScale,
    geometries: true
  });

  var nonSugarcaneMask = cropMask.updateMask(cropMask).paint(caneFarms.geometry(), 0).unmask(1);

  var negativeSamples = median.updateMask(nonSugarcaneMask).sample({
    region: aoi,
    scale: analysisScale,
    numPixels: 500,
    geometries: true
  }).map(function(f) {
    return f.set('landcover', 0);
  });

  var trainingSamples = positiveSamples.merge(negativeSamples);

  // Train classifier and classify
  var classifier = ee.Classifier.smileRandomForest(100).train({
    features: trainingSamples,
    classProperty: 'landcover',
    inputProperties: indices
  });

  var classified = median.select(indices).classify(classifier);
  var sugarcaneMask = classified.updateMask(cropMask).eq(1);

  // --- 3. Convert Raster to Vectors ---
  // This is the final raster of sugarcane (1 = cane, 0/masked = not cane)
  var sugarcanePolygons = sugarcaneMask.selfMask() // Mask out non-cane pixels
                                .reduceToVectors({
                                  geometry: aoi,
                                  scale: analysisScale,
                                  geometryType: 'polygon',
                                  eightConnected: true,
                                  labelProperty: 'landcover',
                                  maxPixels: 1e13
                                });

  // --- 4. Export to Drive ---
  Export.table.toDrive({
    collection: sugarcanePolygons,
    description: 'Sugarcane_Vectors_' + exportLabel,
    folder: 'GEE_Exports',
    fileFormat: 'SHP' // Export as Shapefile
  });

  // Remove the "working" label after 5 seconds
  ui.util.setTimeout(function() {
    uiPanel.remove(workingLabel);
  }, 5000);
}
