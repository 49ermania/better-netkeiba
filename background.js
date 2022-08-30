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

const backgroundListener = (req, sender, sendResponse) => {
  if (req.url) {
    return remoteFetchListener(req, sender, sendResponse);
  }
  else if (req.domain) {
    chrome.cookies.getAll({ domain: req.domain, path: req.path, name: req.name }, function(cookies) {
      for (const cookie of cookies) {
        chrome.cookies.remove({ url: 'https://' + cookie.domain.replace(/^\./, '') + cookie.path, name: cookie.name });
      }
    });
    sendResponse({ result: true });

    return true;
  }
  else {
    sendError('missing req');

    return false;
  }
}

chrome.runtime.onMessage.addListener(backgroundListener);
