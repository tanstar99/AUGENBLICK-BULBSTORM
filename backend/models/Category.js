import mongoose from "mongoose";

const categorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Category name is required"],
      unique: true,
      trim: true,
      maxlength: [100, "Category name cannot exceed 100 characters"],
    },
    slug: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, "Description cannot exceed 500 characters"],
    },
    icon: {
      type: String,
      default: "package", // Icon identifier for frontend
    },
    image: {
      type: String, // URL to category image
      default: null,
    },
    // Subcategories
    subcategories: [
      {
        name: { type: String, required: true, trim: true },
        slug: { type: String, required: true, trim: true },
        description: { type: String, trim: true },
      },
    ],
    // Impact calculation factors
    impactFactors: {
      co2PerKg: {
        type: Number,
        default: 2.5, // kg CO2 saved per kg of material reused
      },
      landfillDiversionFactor: {
        type: Number,
        default: 1.0, // Multiplier for landfill diversion calculation
      },
    },
    // Default unit for this category
    defaultUnit: {
      type: String,
      enum: ["pieces", "kg", "tons", "cubic_meters", "square_meters", "liters", "units"],
      default: "pieces",
    },
    // Category status
    isActive: {
      type: Boolean,
      default: true,
    },
    // Display order
    sortOrder: {
      type: Number,
      default: 0,
    },
    // Statistics (cached)
    stats: {
      totalListings: { type: Number, default: 0 },
      activeListings: { type: Number, default: 0 },
      totalTransactions: { type: Number, default: 0 },
    },
    // Parent category for hierarchical structure (optional)
    parent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Category",
      default: null,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
categorySchema.index({ slug: 1 });
categorySchema.index({ isActive: 1, sortOrder: 1 });
categorySchema.index({ parent: 1 });
categorySchema.index({ name: "text", description: "text" });

// Generate slug from name before saving
categorySchema.pre("save", function (next) {
  if (this.isModified("name") && !this.slug) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  next();
});

// Virtual for child categories
categorySchema.virtual("children", {
  ref: "Category",
  localField: "_id",
  foreignField: "parent",
});

// Static method to get all active categories with stats
categorySchema.statics.getActiveCategories = function () {
  return this.find({ isActive: true }).sort({ sortOrder: 1, name: 1 });
};

// Static method to seed default categories
categorySchema.statics.seedDefaultCategories = async function () {
  const defaultCategories = [
    {
      name: "Construction Materials",
      slug: "construction-materials",
      icon: "building",
      description: "Bricks, cement, wood, tiles, pipes, and other construction materials",
      subcategories: [
        { name: "Bricks & Blocks", slug: "bricks-blocks" },
        { name: "Wood & Timber", slug: "wood-timber" },
        { name: "Metal & Steel", slug: "metal-steel" },
        { name: "Tiles & Flooring", slug: "tiles-flooring" },
        { name: "Pipes & Fittings", slug: "pipes-fittings" },
        { name: "Doors & Windows", slug: "doors-windows" },
      ],
      impactFactors: { co2PerKg: 3.0, landfillDiversionFactor: 1.2 },
      defaultUnit: "kg",
    },
    {
      name: "Furniture",
      slug: "furniture",
      icon: "armchair",
      description: "Tables, chairs, sofas, beds, and other furniture items",
      subcategories: [
        { name: "Office Furniture", slug: "office-furniture" },
        { name: "Home Furniture", slug: "home-furniture" },
        { name: "Outdoor Furniture", slug: "outdoor-furniture" },
        { name: "Storage Units", slug: "storage-units" },
      ],
      impactFactors: { co2PerKg: 2.8, landfillDiversionFactor: 1.0 },
      defaultUnit: "pieces",
    },
    {
      name: "Electronics",
      slug: "electronics",
      icon: "cpu",
      description: "Computers, phones, appliances, and electronic components",
      subcategories: [
        { name: "Computers & Laptops", slug: "computers-laptops" },
        { name: "Mobile Devices", slug: "mobile-devices" },
        { name: "Home Appliances", slug: "home-appliances" },
        { name: "Electronic Components", slug: "electronic-components" },
        { name: "Cables & Wires", slug: "cables-wires" },
      ],
      impactFactors: { co2PerKg: 5.0, landfillDiversionFactor: 1.5 },
      defaultUnit: "pieces",
    },
    {
      name: "Packaging Materials",
      slug: "packaging-materials",
      icon: "package",
      description: "Boxes, pallets, bubble wrap, and packaging supplies",
      subcategories: [
        { name: "Cardboard Boxes", slug: "cardboard-boxes" },
        { name: "Wooden Pallets", slug: "wooden-pallets" },
        { name: "Plastic Containers", slug: "plastic-containers" },
        { name: "Packing Materials", slug: "packing-materials" },
      ],
      impactFactors: { co2PerKg: 2.0, landfillDiversionFactor: 0.9 },
      defaultUnit: "pieces",
    },
    {
      name: "Industrial Surplus",
      slug: "industrial-surplus",
      icon: "factory",
      description: "Machinery parts, raw materials, and industrial equipment",
      subcategories: [
        { name: "Machinery & Equipment", slug: "machinery-equipment" },
        { name: "Raw Materials", slug: "raw-materials" },
        { name: "Tools & Hardware", slug: "tools-hardware" },
        { name: "Safety Equipment", slug: "safety-equipment" },
      ],
      impactFactors: { co2PerKg: 4.0, landfillDiversionFactor: 1.3 },
      defaultUnit: "kg",
    },
    {
      name: "Textiles & Fabrics",
      slug: "textiles-fabrics",
      icon: "shirt",
      description: "Fabric rolls, clothing, curtains, and textile materials",
      subcategories: [
        { name: "Fabric Rolls", slug: "fabric-rolls" },
        { name: "Clothing", slug: "clothing" },
        { name: "Curtains & Upholstery", slug: "curtains-upholstery" },
        { name: "Industrial Textiles", slug: "industrial-textiles" },
      ],
      impactFactors: { co2PerKg: 3.5, landfillDiversionFactor: 1.1 },
      defaultUnit: "kg",
    },
    {
      name: "Glass & Ceramics",
      slug: "glass-ceramics",
      icon: "wine",
      description: "Glass panels, bottles, ceramic tiles, and pottery",
      subcategories: [
        { name: "Glass Panels", slug: "glass-panels" },
        { name: "Bottles & Containers", slug: "bottles-containers" },
        { name: "Ceramic Items", slug: "ceramic-items" },
      ],
      impactFactors: { co2PerKg: 1.8, landfillDiversionFactor: 0.8 },
      defaultUnit: "kg",
    },
    {
      name: "Plastics",
      slug: "plastics",
      icon: "recycle",
      description: "Plastic containers, sheets, pipes, and recyclable plastics",
      subcategories: [
        { name: "Plastic Sheets", slug: "plastic-sheets" },
        { name: "Containers & Drums", slug: "containers-drums" },
        { name: "Plastic Pipes", slug: "plastic-pipes" },
        { name: "Recyclable Plastics", slug: "recyclable-plastics" },
      ],
      impactFactors: { co2PerKg: 6.0, landfillDiversionFactor: 1.4 },
      defaultUnit: "kg",
    },
    {
      name: "Paper & Cardboard",
      slug: "paper-cardboard",
      icon: "file-text",
      description: "Paper rolls, cardboard, newspapers, and paper products",
      subcategories: [
        { name: "Paper Rolls", slug: "paper-rolls" },
        { name: "Cardboard Sheets", slug: "cardboard-sheets" },
        { name: "Newspapers & Magazines", slug: "newspapers-magazines" },
        { name: "Office Paper", slug: "office-paper" },
      ],
      impactFactors: { co2PerKg: 1.5, landfillDiversionFactor: 0.7 },
      defaultUnit: "kg",
    },
    {
      name: "Other",
      slug: "other",
      icon: "more-horizontal",
      description: "Miscellaneous reusable materials",
      subcategories: [],
      impactFactors: { co2PerKg: 2.0, landfillDiversionFactor: 1.0 },
      defaultUnit: "pieces",
      sortOrder: 999,
    },
  ];

  for (let i = 0; i < defaultCategories.length; i++) {
    const category = defaultCategories[i];
    await this.findOneAndUpdate(
      { slug: category.slug },
      { ...category, sortOrder: category.sortOrder ?? i },
      { upsert: true, new: true }
    );
  }

  console.log("Default categories seeded successfully");
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
