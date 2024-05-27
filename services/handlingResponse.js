exports.sendResponse = (result, message, data) => {
  return {
    success: result,
    message: message,
    data,
  };
};
