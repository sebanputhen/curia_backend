const mongoose = require("mongoose");

const priestSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    hname: { type: String, required: true },
    dob: { type: Date, required: true },
    ordinationDate: { type: Date, required: true },
    email: { type: String },
    phone: { type: String },

    // Home type: "homeDiocese" | "otherDiocese" | "congregation"
    homeType: {
      type: String,
      enum: ["homeDiocese", "otherDiocese", "congregation"],
      required: true,
    },

    // If homeType === "homeDiocese" → ref to Parish
    homeParish: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Parish",
      default: null,
    },

    // If homeType === "otherDiocese" → free text
    homeParishText: { type: String, default: "" },

    // If homeType === "congregation" → ref to Congregation
    homeCongregation: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Congregation",
      default: null,
    },

    // Status
    status: {
      type: String,
      enum: ["active", "inactive", "retired", "died"],
      required: true,
      default: "active",
    },

    // Date of retirement or death (only for retired/died)
    statusDate: { type: Date, default: null },

    // Rest home (only for retired)
    restHome: { type: String, default: "" },
  },
  { timestamps: true }
);

const Priest = mongoose.model("Priest", priestSchema);
module.exports = Priest;