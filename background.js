'use strict';

const remoteFetchListener = (req, sender, sendResponse) => {
  if (!req.url) {
    sendError('missing url');

    return false;
  }
  try {
    new URL(req.url);
  }
  catch {
    sendError('Invalid URL: ' + req.url);

    return false;
  }

  fetch(req.url, req.option)
  .then(async res => {
    if (!res.ok) {
      throw new Error('Rensponse is not ok: ' + res.status);
    }
    let result = null;
    if (req.type === 'json') {
      result = await res.json();
    }
    else if (req.type === 'buffer') {
      const ab = await res.arrayBuffer();
      result = Array.from(new Uint8Array(ab));
    }
    else {
      result = await res.text();
    }
    sendResponse({ result });
  })
  .catch(err => {
    sendError('Fetch error: ' + err.message);
  });

  return true;

  function sendError(message) {
    sendResponse({ error: message });
  };
}

chrome.runtime.onMessage.addListener(remoteFetchListener);
