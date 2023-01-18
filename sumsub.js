const axios = require("axios");
const crypto = require("crypto");
const FormData = require("form-data");

// These parameters should be used for all requests
const SUMSUB_APP_TOKEN =
  "sbx:XGt9Rw9QwSznG82NPWKCs2pz.F9S62utltEVDrJ9FrH52OC071vODIUJn";
const SUMSUB_SECRET_KEY = "l8psuK74h0zszQlouS65MZaYfZNHrHqt";
const SUMSUB_BASE_URL = "https://api.sumsub.com";

const config = {};
config.baseURL = SUMSUB_BASE_URL;
/*
axios.interceptors.request.use(createSignature, function (error) {
  return Promise.reject(error);
});
*/
// This function creates signature for the request as described here: https://developers.sumsub.com/api-reference/#app-tokens

function createSignature(config) {
  const ts = Math.floor(Date.now() / 1000);
  const signature = crypto.createHmac("sha256", SUMSUB_SECRET_KEY);
  signature.update(ts + config.method.toUpperCase() + config.url);

  if (config.data instanceof FormData) {
    signature.update(config.data.getBuffer());
  } else if (config.data) {
    signature.update(config.data);
  }

  config.headers["X-App-Access-Ts"] = ts;
  config.headers["X-App-Access-Sig"] = signature.digest("hex");

  return config;
}

// These functions configure requests for specified method

// https://developers.sumsub.com/api-reference/#creating-an-applicant
const createApplicant = async (body, levelName) => {
  const method = "post";
  const url = `/resources/applicants?levelName=${levelName}`;

  const headers = {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-App-Token": SUMSUB_APP_TOKEN,
  };

  config.method = method;
  config.url = url;
  config.headers = headers;
  config.data = JSON.stringify(body);

  const response = await axios(config);
  return response.data;
};

// https://developers.sumsub.com/api-reference/#adding-an-id-document
const addDocument = async (applicantId, document, metadata) => {
  const method = "post";
  const url = `/resources/applicants/${applicantId}/info/idDoc`;

  const form = new FormData();
  form.append("metadata", JSON.stringify(metadata));
  form.append("content", document);

  const headers = {
    Accept: "application/json",
    "X-App-Token": SUMSUB_APP_TOKEN,
  };

  config.method = method;
  config.url = url;
  config.headers = Object.assign(headers, form.getHeaders());
  config.data = form;

  const response = await axios(config);
  return response.data;
};

// https://developers.sumsub.com/api-reference/#getting-applicant-status-sdk
const getApplicantStatus = async (applicantId) => {
  const method = "get";
  const url = `/resources/applicants/${applicantId}/status`;

  const headers = {
    Accept: "application/json",
    "X-App-Token": SUMSUB_APP_TOKEN,
  };

  config.method = method;
  config.url = url;
  config.headers = headers;
  config.data = null;
  console.log("config", config)
  const response = await axios(config);
  console.log("response", response)

  // return response.data;
};

const resetApplicant = async (applicantId) => {
  const method = "post";
  const url = `/resources/applicants/${applicantId}/reset`;

  const headers = {
    Accept: "application/json",
    "X-App-Token": SUMSUB_APP_TOKEN,
  };

  config.method = method;
  config.url = url;
  config.headers = headers;
  config.data = null;

  const response = await axios(config);
  return response.data;
};

module.exports = {
  createApplicant,
  addDocument,
  getApplicantStatus,
  resetApplicant
};
