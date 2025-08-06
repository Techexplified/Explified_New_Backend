const sharp = require('sharp');
const path = require('path');
const fs = require('fs').promises;

// Filter definitions organized by category
const filterDefinitions = {
  basic: {
    grayscale: (image) => image.grayscale(),
    sepia: (image) => image.tint({ r: 255, g: 240, b: 200 }),
    invert: (image) => image.negate(),
    blur: (image) => image.blur(3),
    brightness: (image) => image.modulate({ brightness: 1.5 }),
    contrast: (image) => image.modulate({ brightness: 1, saturation: 1, hue: 0 }).normalize()
  },
  
  instagram: {
    clarendon: (image) => image.modulate({ brightness: 1.1, saturation: 1.35 }).normalize(),
    gingham: (image) => image.grayscale().tint({ r: 255, g: 245, b: 235 }).modulate({ brightness: 1.05 }),
    moon: (image) => image.grayscale().modulate({ contrast: 1.1, brightness: 1.1 }),
    lark: (image) => image.modulate({ brightness: 1.1, saturation: 0.9, hue: 0 }),
    reyes: (image) => image.modulate({ brightness: 1.1, saturation: 0.75 }).tint({ r: 255, g: 245, b: 235 }),
    juno: (image) => image.modulate({ brightness: 1.1, saturation: 1.4 }),
    slumber: (image) => image.modulate({ brightness: 1.05, saturation: 0.66 }),
    crema: (image) => image.modulate({ brightness: 1.15, saturation: 0.9 }).tint({ r: 255, g: 248, b: 240 }),
    ludwig: (image) => image.modulate({ brightness: 1.05, saturation: 0.88 }),
    aden: (image) => image.modulate({ brightness: 1.2, saturation: 0.85 }).tint({ r: 255, g: 250, b: 240 })
  },
  
  professional: {
    portrait: (image) => image.modulate({ brightness: 1.1, saturation: 1.05 }).sharpen(1),
    landscape: (image) => image.modulate({ brightness: 1.05, saturation: 1.3 }).sharpen(2),
    vintage: (image) => image.modulate({ brightness: 1.1, saturation: 0.8 }).tint({ r: 255, g: 240, b: 200 }).gamma(1.2),
    dramatic: (image) => image.modulate({ brightness: 0.95, saturation: 1.3, hue: 10 }).sharpen(2),
    soft: (image) => image.blur(0.5).modulate({ brightness: 1.1, saturation: 0.9 }),
    warm: (image) => image.tint({ r: 255, g: 245, b: 220 }).modulate({ saturation: 1.1 }),
    cool: (image) => image.tint({ r: 220, g: 235, b: 255 }).modulate({ saturation: 1.1 }),
    hdr: (image) => image.modulate({ brightness: 1.1, contrast: 1.3 }).gamma(1.4).sharpen(1)
  },
  
  artistic: {
    comic: (image) => image.modulate({ brightness: 1.1, saturation: 1.3, hue: 0 }).sharpen(3).normalize(),
    dreamy: (image) => image.blur(1).modulate({ brightness: 1.2, saturation: 0.8 }),
    neon: (image) => image.modulate({ brightness: 1.2, saturation: 2, hue: 90 }),
    retro: (image) => image.tint({ r: 255, g: 230, b: 180 }).modulate({ brightness: 1.1, saturation: 0.8 }),
    cyberpunk: (image) => image.modulate({ brightness: 1.1, saturation: 1.5, hue: 270 }).sharpen(2),
    pastel: (image) => image.modulate({ brightness: 1.3, saturation: 0.6 }).tint({ r: 255, g: 250, b: 250 })
  }
};

// Apply filter to image
const applyFilter = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No image file provided'
      });
    }

    const { filterType, category = 'basic' } = req.body;
    
    if (!filterType) {
      return res.status(400).json({
        success: false,
        error: 'Filter type is required'
      });
    }

    // Check if filter exists in the specified category
    if (!filterDefinitions[category] || !filterDefinitions[category][filterType]) {
      return res.status(400).json({
        success: false,
        error: `Filter '${filterType}' not found in category '${category}'`
      });
    }

    const inputPath = req.file.path;
    const outputFilename = `filtered-${filterType}-${Date.now()}-${Math.round(Math.random() * 1E9)}.jpg`;
    const outputPath = path.join('uploads', 'filtered', outputFilename);

    // Get image metadata
    const metadata = await sharp(inputPath).metadata();
    
    // Apply the filter
    let processedImage = sharp(inputPath);
    
    // Apply the specific filter function
    processedImage = filterDefinitions[category][filterType](processedImage);
    
    // Ensure the image is in JPEG format and optimize
    await processedImage
      .jpeg({ 
        quality: 90, 
        progressive: true,
        mozjpeg: true 
      })
      .toFile(outputPath);

    // Clean up original file after successful processing
    try {
      await fs.unlink(inputPath);
    } catch (cleanupError) {
      console.error('Error cleaning up original file:', cleanupError);
    }

    console.log(`✅ Filter applied: ${filterType} (${category}) -> ${outputFilename}`);

    res.json({
      success: true,
      message: 'Filter applied successfully',
      filteredImageUrl: `/uploads/filtered/${outputFilename}`,
      metadata: {
        filterType,
        category,
        dimensions: {
          width: metadata.width,
          height: metadata.height
        },
        originalFileSize: req.file.size,
        format: metadata.format
      }
    });

  } catch (error) {
    console.error('Filter application error:', error);
    
    // Clean up files in case of error
    if (req.file && req.file.path) {
      try {
        await fs.unlink(req.file.path);
      } catch (cleanupError) {
        console.error('Error cleaning up file after error:', cleanupError);
      }
    }

    res.status(500).json({
      success: false,
      error: 'Failed to apply filter',
      message: error.message
    });
  }
};

// Get available filters
const getAvailableFilters = (req, res) => {
  try {
    const filters = {};
    
    Object.keys(filterDefinitions).forEach(category => {
      filters[category] = {
        name: category.charAt(0).toUpperCase() + category.slice(1),
        filters: Object.keys(filterDefinitions[category]).map(filterKey => ({
          id: filterKey,
          name: filterKey.charAt(0).toUpperCase() + filterKey.slice(1),
          category: category
        }))
      };
    });

    res.json({
      success: true,
      filters: filters,
      totalCategories: Object.keys(filters).length,
      totalFilters: Object.values(filterDefinitions).reduce((total, category) => 
        total + Object.keys(category).length, 0
      )
    });

  } catch (error) {
    console.error('Error getting available filters:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get available filters',
      message: error.message
    });
  }
};

module.exports = {
  applyFilter,
  getAvailableFilters
};