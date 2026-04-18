import mongoose from "mongoose";

const maintenanceSchema = new mongoose.Schema(
  {
    jobtype: {
      type: String,
      required: true,
      trim: true,
    },
    code: {
      type: String,
      required: true,
      trim: true,
    },
    jobdate: {
      type: String,
      required: true,
    },
    problem: {
      type: String,
      required: true,
      trim: true,
    },
    jobdetail: {
      type: String,
      required: true,
      trim: true,
    },
    rootcause: {
      type: String,
      required: true,
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
    supplier: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      required: true,
      trim: true,
    },
    requestby: {
      type: String,
      required: true,
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
    jobtime: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Maintenance = mongoose.model("Maintenance", maintenanceSchema);

export default Maintenance;
