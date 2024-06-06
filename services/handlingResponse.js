exports.sendResponse = (result, message, data, dataKey) => {
  return {
    success: result,
    message: message,
    [dataKey]: data,
  };
};
