import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    jobtype: {
      type: String,
      default: "",
      trim: true,
    },
    code: {
      type: String,
      default: "",
      trim: true,
    },
    jobdate: {
      type: String,
      default: "",
    },
    problem: {
      type: String,
      default: "",
      trim: true,
    },
    jobdetail: {
      type: String,
      default: "",
      trim: true,
    },
    rootcause: {
      type: String,
      default: "",
      trim: true,
    },
    cost: {
      type: Number,
      default: 0,
    },
    completiondate: {
      type: String,
      default: "",
    },
    jobtime: {
      type: Number, // minutes
      default: 0,
    },
    supplier: {
      type: String,
      default: "",
      trim: true,
    },
    status: {
      type: String,
      default: "",
      trim: true,
    },

    // --- New MRF fields ---
    requestby: {
      type: String,
      default: "",
      trim: true,
    },
    checkedrequestorby: {
      type: String,
      default: "",
      trim: true,
    },
    verifiedbyhod: {
      type: String,
      default: "",
      trim: true,
    },
    commentPreventive: {
      type: String,
      default: "",
      trim: true,
    },
    comment: {
      type: String,
      default: "",
      trim: true,
    },
  },
  { timestamps: true }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;