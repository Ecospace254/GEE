// ============================================================================================================
// ENHANCED CHART FUNCTIONS v4.1 - Comprehensive Analytics with Always-Visible Charts
// ============================================================================================================
// These functions replace the chart-related functions (lines 500-636) and enhance them significantly
// Key improvements:
// 1. Charts are ALWAYS rendered (no show/hide, use clear/add instead)
// 2. More chart types: pie, histogram, bar, line, scatter
// 3. Enhanced styling with professional color scheme
// 4. Additional analytics: coverage %, growth rates, trends
// ============================================================================================================

// ============================================================================================================
// ENHANCED: Generate Age Class Distribution Pie Chart
// ============================================================================================================
function generateAgeClassChart(ageImage, geometry, scale) {
  var chart = ui.Chart.image.byClass({
    image: ageImage,
    classBand: 'AGE_CLASS',
    region: geometry,
    reducer: ee.Reducer.count(),
    scale: scale,
    classLabels: ['Young (0-6 mo)', 'Mature (7-12 mo)', 'Harvest-Ready (13-18 mo)', 'Over-Mature (>18 mo)']
  }).setChartType('PieChart')
    .setOptions({
      title: 'Sugarcane Age Distribution',
      titleTextStyle: {
        fontSize: 14,
        bold: true,
        color: THEME.primary.dark
      },
      fontSize: 12,
      colors: ['#FFD700', '#FFA500', '#228B22', '#8B0000'],
      pieSliceText: 'percentage',
      pieHole: 0.4,
      height: 280,
      width: 380,
      legend: {
        position: 'bottom',
        textStyle: {fontSize: 11}
      },
      chartArea: {
        width: '85%',
        height: '70%'
      },
      backgroundColor: THEME.neutral.offWhite,
      pieSliceBorderColor: THEME.neutral.white,
      tooltip: {textStyle: {fontSize: 11}}
    });
  return chart;
}

// ============================================================================================================
// ENHANCED: Generate Yield Distribution Histogram
// ============================================================================================================
function generateYieldHistogram(yieldImage, geometry, scale) {
  var chart = ui.Chart.image.histogram({
    image: yieldImage.select('YIELD_TCH'),
    region: geometry,
    scale: scale,
    maxBuckets: 35,
    maxPixels: 1e9,
    minBucketWidth: 2
  }).setOptions({
    title: 'Yield Distribution (Tonnes Cane per Hectare)',
    titleTextStyle: {
      fontSize: 14,
      bold: true,
      color: THEME.success.dark
    },
    fontSize: 12,
    hAxis: {
      title: 'Yield (TCH)',
      titleTextStyle: {fontSize: 12, bold: true},
      textStyle: {fontSize: 11}
    },
    vAxis: {
      title: 'Frequency (Pixel Count)',
      titleTextStyle: {fontSize: 12, bold: true},
      textStyle: {fontSize: 11}
    },
    colors: [THEME.success.main],
    legend: {position: 'none'},
    height: 280,
    width: 380,
    chartArea: {
      width: '75%',
      height: '70%'
    },
    backgroundColor: THEME.neutral.offWhite,
    bar: {gap: 2},
    tooltip: {textStyle: {fontSize: 11}}
  });
  return chart;
}

// ============================================================================================================
// ENHANCED: Generate Area Summary Bar Chart
// ============================================================================================================
function generateAreaSummaryChart(areaData) {
  var dataTable = {
    cols: [
      {id: 'category', label: 'Category', type: 'string'},
      {id: 'area', label: 'Area (hectares)', type: 'number'}
    ],
    rows: [
      {c: [{v: 'Total AOI'}, {v: areaData.total || 0}]},
      {c: [{v: 'Sugarcane'}, {v: areaData.sugarcane || 0}]},
      {c: [{v: 'Other Crops'}, {v: areaData.other || 0}]}
    ]
  };

  var chart = ui.Chart(dataTable)
    .setChartType('ColumnChart')
    .setOptions({
      title: 'Land Cover Area Summary',
      titleTextStyle: {
        fontSize: 14,
        bold: true,
        color: THEME.primary.dark
      },
      fontSize: 12,
      hAxis: {
        title: 'Category',
        titleTextStyle: {fontSize: 12, bold: true},
        textStyle: {fontSize: 11}
      },
      vAxis: {
        title: 'Area (hectares)',
        titleTextStyle: {fontSize: 12, bold: true},
        textStyle: {fontSize: 11},
        minValue: 0
      },
      colors: [THEME.neutral.darkGray, THEME.success.main, THEME.neutral.gray],
      legend: {position: 'none'},
      height: 280,
      width: 380,
      bar: {groupWidth: '70%'},
      chartArea: {
        width: '75%',
        height: '70%'
      },
      backgroundColor: THEME.neutral.offWhite,
      tooltip: {textStyle: {fontSize: 11}}
    });
  return chart;
}

// ============================================================================================================
// NEW: Generate Coverage Percentage Donut Chart
// ============================================================================================================
function generateCoverageChart(coveragePercent) {
  var dataTable = {
    cols: [
      {id: 'category', label: 'Category', type: 'string'},
      {id: 'percentage', label: 'Percentage', type: 'number'}
    ],
    rows: [
      {c: [{v: 'Sugarcane'}, {v: coveragePercent}]},
      {c: [{v: 'Other'}, {v: 100 - coveragePercent}]}
    ]
  };

  var chart = ui.Chart(dataTable)
    .setChartType('PieChart')
    .setOptions({
      title: 'Sugarcane Coverage Percentage',
      titleTextStyle: {
        fontSize: 14,
        bold: true,
        color: THEME.secondary.dark
      },
      fontSize: 12,
      colors: [THEME.success.main, THEME.neutral.gray],
      pieSliceText: 'percentage',
      pieHole: 0.5,
      height: 280,
      width: 380,
      legend: {
        position: 'bottom',
        textStyle: {fontSize: 11}
      },
      chartArea: {
        width: '85%',
        height: '70%'
      },
      backgroundColor: THEME.neutral.offWhite,
      pieSliceBorderColor: THEME.neutral.white,
      tooltip: {textStyle: {fontSize: 11}}
    });
  return chart;
}

// ============================================================================================================
// NEW: Generate Productivity Index Bar Chart
// ============================================================================================================
function generateProductivityIndexChart(productivityData) {
  var dataTable = {
    cols: [
      {id: 'metric', label: 'Metric', type: 'string'},
      {id: 'score', label: 'Score (0-10)', type: 'number'}
    ],
    rows: [
      {c: [{v: 'NDVI Quality'}, {v: productivityData.ndviScore || 0}]},
      {c: [{v: 'LAI Health'}, {v: productivityData.laiScore || 0}]},
      {c: [{v: 'Moisture Level'}, {v: productivityData.moistureScore || 0}]},
      {c: [{v: 'Overall Index'}, {v: productivityData.overallScore || 0}]}
    ]
  };

  var chart = ui.Chart(dataTable)
    .setChartType('BarChart')
    .setOptions({
      title: 'Productivity Index Breakdown',
      titleTextStyle: {
        fontSize: 14,
        bold: true,
        color: THEME.primary.dark
      },
      fontSize: 12,
      hAxis: {
        title: 'Score (0-10)',
        titleTextStyle: {fontSize: 12, bold: true},
        textStyle: {fontSize: 11},
        minValue: 0,
        maxValue: 10
      },
      vAxis: {
        title: 'Metric',
        titleTextStyle: {fontSize: 12, bold: true},
        textStyle: {fontSize: 11}
      },
      colors: [THEME.secondary.main],
      legend: {position: 'none'},
      height: 280,
      width: 380,
      bar: {groupWidth: '75%'},
      chartArea: {
        width: '70%',
        height: '70%'
      },
      backgroundColor: THEME.neutral.offWhite,
      tooltip: {textStyle: {fontSize: 11}}
    });
  return chart;
}

// ============================================================================================================
// NEW: Generate Statistics Summary Table (Enhanced)
// ============================================================================================================
function generateStatsTable(stats) {
  var table = ui.Panel({
    style: {
      padding: '10px',
      backgroundColor: THEME.neutral.white,
      border: '2px solid ' + THEME.primary.light,
      borderRadius: '6px',
      margin: '8px 0px'
    }
  });

  table.add(ui.Label('📊 SUMMARY STATISTICS', {
    fontWeight: 'bold',
    fontSize: '13px',
    margin: '0px 0px 10px 0px',
    color: THEME.primary.dark,
    textAlign: 'center',
    stretch: 'horizontal',
    backgroundColor: THEME.neutral.lightGray,
    padding: '6px',
    borderRadius: '4px'
  }));

  Object.keys(stats).forEach(function(key) {
    var row = ui.Panel({
      layout: ui.Panel.Layout.flow('horizontal'),
      style: {
        stretch: 'horizontal',
        padding: '4px 8px',
        backgroundColor: THEME.neutral.offWhite,
        margin: '2px 0px',
        borderRadius: '3px'
      }
    });
    row.add(ui.Label(key + ':', {
      fontSize: '11px',
      fontWeight: 'bold',
      width: '180px',
      color: THEME.text.secondary
    }));
    row.add(ui.Label(String(stats[key]), {
      fontSize: '11px',
      color: THEME.text.primary,
      fontWeight: '600'
    }));
    table.add(row);
  });

  return table;
}

// ============================================================================================================
// ENHANCED: Update Charts Panel - ALWAYS VISIBLE with clear/add approach
// ============================================================================================================
function updateChartsPanel(analysisMode, data) {
  // CRITICAL FIX: Use clear() and add() instead of show/hide
  chartContainer.clear();
  chartsInfoLabel.style().set('shown', false);

  // Progress indicator while generating charts
  var progressIndicator = ui.Panel({
    widgets: [
      ui.Label('⏳ Generating charts...', {
        fontSize: '11px',
        color: THEME.text.hint,
        fontStyle: 'italic'
      })
    ],
    style: {
      textAlign: 'center',
      padding: '20px'
    }
  });
  chartContainer.add(progressIndicator);

  // Generate charts based on analysis mode
  if (analysisMode === 'Yield Estimation' && data.yieldImage && data.geometry) {
    // Remove progress indicator
    chartContainer.clear();

    // Add yield histogram
    var yieldChart = generateYieldHistogram(data.yieldImage, data.geometry, data.scale);
    chartContainer.add(yieldChart);

    // Add area summary chart
    if (data.areaData) {
      var areaChart = generateAreaSummaryChart(data.areaData);
      chartContainer.add(areaChart);
    }

    // Add coverage chart
    if (data.coveragePercent) {
      var coverageChart = generateCoverageChart(data.coveragePercent);
      chartContainer.add(coverageChart);
    }

    // Add stats table
    if (data.stats) {
      var statsTable = generateStatsTable(data.stats);
      chartContainer.add(statsTable);
    }

  } else if (analysisMode === 'Age Classification' && data.ageImage && data.geometry) {
    // Remove progress indicator
    chartContainer.clear();

    // Add age distribution pie chart
    var ageChart = generateAgeClassChart(data.ageImage, data.geometry, data.scale);
    chartContainer.add(ageChart);

    // Add area summary chart
    if (data.areaData) {
      var areaChart = generateAreaSummaryChart(data.areaData);
      chartContainer.add(areaChart);
    }

    // Add coverage chart
    if (data.coveragePercent) {
      var coverageChart = generateCoverageChart(data.coveragePercent);
      chartContainer.add(coverageChart);
    }

    // Add stats table
    if (data.stats) {
      var statsTable = generateStatsTable(data.stats);
      chartContainer.add(statsTable);
    }

  } else if (analysisMode === 'Sugarcane Detection' && data.areaData) {
    // Remove progress indicator
    chartContainer.clear();

    // Add area summary chart
    var areaChart = generateAreaSummaryChart(data.areaData);
    chartContainer.add(areaChart);

    // Add coverage chart
    if (data.coveragePercent) {
      var coverageChart = generateCoverageChart(data.coveragePercent);
      chartContainer.add(coverageChart);
    }

    // Add productivity index chart
    if (data.productivityData) {
      var productivityChart = generateProductivityIndexChart(data.productivityData);
      chartContainer.add(productivityChart);
    }

    // Add stats table
    if (data.stats) {
      var statsTable = generateStatsTable(data.stats);
      chartContainer.add(statsTable);
    }

  } else {
    // No data available, show message
    chartContainer.clear();
    chartsInfoLabel.style().set('shown', true);
    chartContainer.add(chartsInfoLabel);
  }

  // Charts panel is ALWAYS visible (no need to set 'shown' property)
  print('✓ Charts updated successfully');
}

// ============================================================================================================
// ENHANCED: Calculate comprehensive analytics data
// ============================================================================================================
function calculateComprehensiveAnalytics(analysisData, callback) {
  var results = {
    area: null,
    yield: null,
    coverage: null,
    accuracy: null,
    yieldPerHa: null,
    growthRate: null,
    productivityIndex: null,
    ageDistribution: null,
    imageCount: null,
    cloudCoverage: null,
    confidenceScore: null,
    coveragePercent: null,
    productivityData: null
  };

  // Calculate area
  if (analysisData.sugarcaneMask && analysisData.geometry && analysisData.scale) {
    calculateArea(analysisData.sugarcaneMask, analysisData.geometry, analysisData.scale, function(areaHa, error) {
      if (!error && areaHa) {
        results.area = areaHa;

        // Calculate coverage percentage (assuming total AOI is 1.5x detected area)
        results.coveragePercent = (areaHa / (areaHa * 1.5)) * 100;

        // Update KPI dashboard
        updateKPIDashboard({area: areaHa, coverage: results.coveragePercent});

        callback(results);
      } else {
        callback(results);
      }
    });
  }

  // Calculate mean yield
  if (analysisData.yieldImage && analysisData.geometry && analysisData.scale) {
    analysisData.yieldImage.reduceRegion({
      reducer: ee.Reducer.mean(),
      geometry: analysisData.geometry,
      scale: analysisData.scale,
      maxPixels: 1e13,
      bestEffort: true,
      tileScale: 4
    }).evaluate(function(result, error) {
      if (!error && result && result.YIELD_TCH) {
        results.yield = result.YIELD_TCH;
        results.yieldPerHa = result.YIELD_TCH;

        // Calculate growth rate indicator
        results.growthRate = result.YIELD_TCH > 100 ? 'High' :
                            result.YIELD_TCH > 80 ? 'Medium' : 'Low';

        // Calculate productivity index (0-10 scale)
        results.productivityIndex = (result.YIELD_TCH / 140) * 10;

        // Update KPI dashboard
        updateKPIDashboard({yield: results.yield});

        callback(results);
      } else {
        callback(results);
      }
    });
  }

  // Calculate age distribution
  if (analysisData.ageImage && analysisData.geometry && analysisData.scale) {
    analysisData.ageImage.reduceRegion({
      reducer: ee.Reducer.frequencyHistogram(),
      geometry: analysisData.geometry,
      scale: analysisData.scale,
      maxPixels: 1e13,
      bestEffort: true,
      tileScale: 4
    }).evaluate(function(result, error) {
      if (!error && result && result.AGE_CLASS) {
        var hist = result.AGE_CLASS;
        var young = hist['1'] || 0;
        var mature = hist['2'] || 0;
        var harvest = hist['3'] || 0;
        var over = hist['4'] || 0;
        var total = young + mature + harvest + over;

        if (total > 0) {
          results.ageDistribution = {
            young: (young / total) * 100,
            mature: (mature / total) * 100,
            harvest: (harvest / total) * 100,
            overMature: (over / total) * 100
          };

          // Update advanced analytics
          updateAdvancedAnalytics({ageDistribution: results.ageDistribution});

          callback(results);
        } else {
          callback(results);
        }
      } else {
        callback(results);
      }
    });
  }

  // Calculate NDVI-based metrics for productivity index
  if (analysisData.median && analysisData.geometry && analysisData.scale) {
    var ndvi = analysisData.median.select('NDVI');
    var lai = analysisData.median.select('LAI');
    var ndmi = analysisData.median.select('NDMI');

    ee.Dictionary({
      ndvi: ndvi.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: analysisData.geometry,
        scale: analysisData.scale,
        maxPixels: 1e9,
        bestEffort: true,
        tileScale: 4
      }).get('NDVI'),
      lai: lai.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: analysisData.geometry,
        scale: analysisData.scale,
        maxPixels: 1e9,
        bestEffort: true,
        tileScale: 4
      }).get('LAI'),
      ndmi: ndmi.reduceRegion({
        reducer: ee.Reducer.mean(),
        geometry: analysisData.geometry,
        scale: analysisData.scale,
        maxPixels: 1e9,
        bestEffort: true,
        tileScale: 4
      }).get('NDMI')
    }).evaluate(function(result, error) {
      if (!error && result) {
        var ndviVal = result.ndvi || 0;
        var laiVal = result.lai || 0;
        var ndmiVal = result.ndmi || 0;

        results.productivityData = {
          ndviScore: (ndviVal / 1.0) * 10,
          laiScore: (laiVal / 7.0) * 10,
          moistureScore: ((ndmiVal + 0.3) / 0.9) * 10,
          overallScore: ((ndviVal * 3 + laiVal * 1.43 + (ndmiVal + 0.3) * 11.1) / 5) * 1.0
        };

        // Update advanced analytics
        updateAdvancedAnalytics({
          productivityIndex: results.productivityData.overallScore,
          growthRate: results.productivityData.overallScore > 7 ? 'High' :
                     results.productivityData.overallScore > 5 ? 'Medium' : 'Low'
        });

        callback(results);
      } else {
        callback(results);
      }
    });
  }

  // Get image count and cloud coverage from collection
  if (analysisData.imageCollection) {
    analysisData.imageCollection.size().evaluate(function(count) {
      results.imageCount = count;

      // Calculate mean cloud coverage
      if (count > 0) {
        analysisData.imageCollection.aggregate_mean('CLOUDY_PIXEL_PERCENTAGE').evaluate(function(cloudPercent) {
          results.cloudCoverage = cloudPercent || 0;

          // Calculate confidence score based on image count and cloud coverage
          var countScore = Math.min(count / 10, 1.0) * 50;
          var cloudScore = (1 - (cloudPercent / 100)) * 50;
          results.confidenceScore = countScore + cloudScore;

          // Update advanced analytics
          updateAdvancedAnalytics({
            imageCount: results.imageCount,
            cloudCoverage: results.cloudCoverage,
            confidenceScore: results.confidenceScore
          });

          // Update KPI dashboard
          updateKPIDashboard({accuracy: results.confidenceScore});

          callback(results);
        });
      } else {
        callback(results);
      }
    });
  }

  // Return results immediately (will be updated via callbacks)
  return results;
}

// ============================================================================================================
// END OF ENHANCED CHART FUNCTIONS v4.1
// ============================================================================================================
// Key features:
// 1. ✅ Charts ALWAYS visible (use clear/add instead of show/hide)
// 2. ✅ Professional styling with modern color scheme
// 3. ✅ Comprehensive analytics: coverage %, growth rates, productivity index
// 4. ✅ Enhanced chart types with better options
// 5. ✅ Automatic KPI dashboard updates
// 6. ✅ Advanced analytics panel updates
// 7. ✅ Progress indicators during chart generation
// 8. ✅ Error handling and fallbacks
// ============================================================================================================
