import SavedSearch from "../models/savedSearchModel.js";

// 💾 Save a Search
export const saveSearch = async (req, res) => {
  try {
    const { keyword, category, minPrice, maxPrice } = req.body;
    const userId = req.user.id || req.user._id;

    // Check if the search parameters are empty
    if (!keyword && (!category || category === "All") && !minPrice && !maxPrice) {
      return res.status(400).json({
        success: false,
        message: "Please provide at least one search criteria to save",
      });
    }

    // Check if duplicate search exists
    const duplicate = await SavedSearch.findOne({
      user: userId,
      keyword: keyword || "",
      category: category || "All",
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });

    if (duplicate) {
      return res.status(400).json({
        success: false,
        message: "You have already saved this search",
      });
    }

    const savedSearch = await SavedSearch.create({
      user: userId,
      keyword: keyword || "",
      category: category || "All",
      minPrice: minPrice || null,
      maxPrice: maxPrice || null,
    });

    res.status(201).json({
      success: true,
      message: "Search saved successfully! You will be notified of matching listings.",
      savedSearch,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 📥 Get all saved searches for user
export const getSavedSearches = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;

    const savedSearches = await SavedSearch.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      savedSearches,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// 🗑️ Delete a saved search
export const deleteSavedSearch = async (req, res) => {
  try {
    const userId = req.user.id || req.user._id;
    const { id } = req.params;

    const savedSearch = await SavedSearch.findOne({ _id: id, user: userId });

    if (!savedSearch) {
      return res.status(404).json({
        success: false,
        message: "Saved search not found or unauthorized",
      });
    }

    await savedSearch.deleteOne();

    res.json({
      success: true,
      message: "Saved search removed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
